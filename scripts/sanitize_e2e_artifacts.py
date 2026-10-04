"""Copy diagnostic artifacts with credentials removed, including report/trace ZIPs."""

import base64
import io
import json
from pathlib import Path
import re
import shutil
import subprocess
import zipfile

REDACTED = "[REDACTED]"
SECRET_KEYS = {
    "password", "confirmpassword", "repeatpassword", "token", "tokenhash",
    "csrftoken", "cookies", "cookie", "set-cookie", "authorization", "x-xsrf-token",
}
BEARER_PATH = re.compile(
    r"(/(?:api/v1/public/)?(?:progress|reports)/|/invite/(?:student|teacher)/)"
    r"[A-Za-z0-9_-]+"
)
REPORT_ZIP = re.compile(r"(data:application/zip;base64,)([A-Za-z0-9+/=]+)")
DEMO_PASSWORDS = ("DemoTeacher123!", "DemoStudent123!", "DemoAdmin123!")


def scrub(value):
    if isinstance(value, dict):
        if str(value.get("name", "")).lower() in SECRET_KEYS:
            return {**value, "value": REDACTED}
        result = {
            key: ([] if key.lower() == "cookies" and isinstance(item, list) else REDACTED)
            if key.lower() in SECRET_KEYS else scrub(item)
            for key, item in value.items()
        }
        if value.get("type") == "password" and "value" in result:
            result["value"] = REDACTED
        if value.get("method") == "fill":
            selector = str(value.get("params", {}).get("selector", ""))
            if re.search(r"password|пароль", selector, re.I):
                result["params"]["value"] = REDACTED
        return result
    if isinstance(value, list):
        return [scrub(item) for item in value]
    if isinstance(value, str):
        # Network request bodies can be JSON strings inside trace events.
        try:
            parsed = json.loads(value)
        except (ValueError, TypeError):
            return scrub_text(value)
        if isinstance(parsed, (dict, list)):
            return json.dumps(scrub(parsed), ensure_ascii=False)
        return scrub_text(value)
    return value


def scrub_text(text):
    for password in DEMO_PASSWORDS:
        text = text.replace(password, REDACTED)
    text = BEARER_PATH.sub(lambda match: match[1] + "REDACTED", text)
    text = re.sub(r"(?i)(Bearer\s+)[A-Za-z0-9._~-]+", r"\1REDACTED", text)
    text = re.sub(r"(?i)((?:TUTOR_SESSION|XSRF-TOKEN)=)[^;\s\"'<]+", r"\1REDACTED", text)
    # Log lines and failure messages may use key=value rather than JSON.
    text = re.sub(r"(?i)((?:[A-Za-z_]*password|tokenHash|csrfToken)\s*[=:]\s*)(\"[^\"]*\"|'[^']*'|[^\s,;]+)", r"\1REDACTED", text)
    return text


def sanitize_zip(payload):
    output = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(payload)) as source, zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as target:
        for entry in source.infolist():
            target.writestr(entry, sanitize_bytes(source.read(entry)))
    return output.getvalue()


def sanitize_bytes(payload):
    if payload.startswith(b"PK\x03\x04"):
        return sanitize_zip(payload)
    try:
        text = payload.decode("utf-8")
    except UnicodeDecodeError:
        return payload  # Images, fonts and other binary diagnostic resources.
    embedded_report = 'id="playwrightReportBase64"' in text
    text = REPORT_ZIP.sub(
        lambda match: match[1] + base64.b64encode(sanitize_zip(base64.b64decode(match[2]))).decode("ascii"),
        text,
    )
    if embedded_report:
        # The HTML contains immutable viewer code; test data lives in its ZIP.
        # Rewriting viewer JavaScript can break the report's parser.
        return text.encode("utf-8")
    lines = []
    for line in text.splitlines(keepends=True):
        try:
            parsed = json.loads(line)
        except ValueError:
            lines.append(scrub_text(line))
        else:
            lines.append(json.dumps(scrub(parsed), ensure_ascii=False) + ("\n" if line.endswith("\n") else ""))
    return "".join(lines).encode("utf-8")


def collect(root, output):
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    for directory in ("playwright-report", "test-results"):
        source = root / directory
        if not source.exists():
            continue
        for path in source.rglob("*"):
            if path.is_file():
                destination = output / path.relative_to(root)
                destination.parent.mkdir(parents=True, exist_ok=True)
                relative = path.relative_to(root)
                static_viewer = directory == "playwright-report" and relative.parts[1] == "trace"
                destination.write_bytes(path.read_bytes() if static_viewer else sanitize_bytes(path.read_bytes()))
    logs = subprocess.run(
        ["docker", "compose", "-f", ".github/e2e/compose.yml", "logs", "--no-color", "--tail", "1000"],
        cwd=root, capture_output=True, check=False,
    )
    (output / "container-logs.txt").write_bytes(sanitize_bytes(logs.stdout + logs.stderr))


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    collect(root, root / "e2e-artifacts")
