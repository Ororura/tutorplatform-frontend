import base64
import io
import json
from pathlib import Path
import sys
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
import sanitize_e2e_artifacts as artifacts


class ArtifactTests(unittest.TestCase):
    def test_network_credentials_nested_request_bodies_and_password_actions(self):
        events = [
            {"request": {"headers": [{"name": "Cookie", "value": "session-secret"}, {"name": "Authorization", "value": "Bearer auth-secret"}], "cookies": [{"value": "cookie-secret"}], "postData": {"text": json.dumps({"email": "demo@test.local", "password": "dynamic-secret"})}}},
            {"method": "fill", "params": {"selector": 'internal:label="Пароль"s', "value": "fill-secret"}},
            {"type": "password", "value": "dom-secret"},
        ]
        result = artifacts.sanitize_bytes("\n".join(json.dumps(event) for event in events).encode()).decode()
        for secret in ["session-secret", "auth-secret", "cookie-secret", "dynamic-secret", "fill-secret", "dom-secret"]:
            self.assertNotIn(secret, result)
        self.assertIn("demo@test.local", result)
        self.assertEqual([], json.loads(result.splitlines()[0])["request"]["cookies"])

    def test_zip_and_embedded_html_report_preserve_diagnostics_without_credentials(self):
        trace = io.BytesIO()
        with zipfile.ZipFile(trace, "w") as archive:
            archive.writestr("events.trace", json.dumps({"url": "http://localhost:3000/api/v1/public/progress/private-token", "status": 410}))
            archive.writestr("resources/body", json.dumps({"password": "body-secret", "result": "PASSED"}))
            archive.writestr("resources/image.png", b"\x89PNG\r\n\x1a\n")
        html = 'const report="data:application/zip;base64,' + base64.b64encode(trace.getvalue()).decode() + '";'
        sanitized = artifacts.sanitize_bytes(html.encode()).decode()
        payload = base64.b64decode(artifacts.REPORT_ZIP.search(sanitized)[2])
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            self.assertNotIn(b"private-token", archive.read("events.trace"))
            self.assertNotIn(b"body-secret", archive.read("resources/body"))
            self.assertIn(b"410", archive.read("events.trace"))
            self.assertIn(b"PASSED", archive.read("resources/body"))
            self.assertEqual(b"\x89PNG\r\n\x1a\n", archive.read("resources/image.png"))

    def test_log_and_error_text_redaction(self):
        text = 'TUTOR_SESSION=session-cookie; password=secret /reports/report-token /invite/student/invite-token DemoTeacher123! const teacherPassword = "teacher password 2026";'
        result = artifacts.scrub_text(text)
        for secret in ["session-cookie", "secret", "report-token", "invite-token", "DemoTeacher123!", "teacher password 2026"]:
            self.assertNotIn(secret, result)

    def test_report_viewer_code_is_preserved_while_embedded_results_are_scrubbed(self):
        data = io.BytesIO()
        with zipfile.ZipFile(data, "w") as archive:
            archive.writestr("result.json", json.dumps({"password": "secret-password"}))
        viewer = '<script>function show(password=defaultPassword) { return password; }</script>'
        html = viewer + '<script id="playwrightReportBase64">data:application/zip;base64,' + base64.b64encode(data.getvalue()).decode() + '</script>'
        result = artifacts.sanitize_bytes(html.encode()).decode()
        self.assertTrue(result.startswith(viewer))
        decoded = base64.b64decode(artifacts.REPORT_ZIP.search(result)[2])
        with zipfile.ZipFile(io.BytesIO(decoded)) as archive:
            self.assertNotIn(b"secret-password", archive.read("result.json"))


if __name__ == "__main__":
    unittest.main()
