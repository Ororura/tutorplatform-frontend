import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Run after building execution-worker/Dockerfile.runtime-web as tutor-web-runtime:1.
if (!process.argv.includes("--container")) {
  const root = path.resolve(dirname, "..");
  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "--network",
      "none",
      "--ipc",
      "none",
      "--read-only",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--pids-limit",
      "128",
      "--memory",
      "512m",
      "--memory-swap",
      "512m",
      "--cpus",
      "1",
      "--user",
      "65534:65534",
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,nodev,size=134217728",
      "--ulimit",
      "nofile=1024:1024",
      "--init",
      "-v",
      filename + ":/fixtures/check.mjs:ro",
      "-v",
      path.join(root, "src/entities/task/model/web-exercise-templates.json") + ":/fixtures/templates.json:ro",
      "-v",
      path.join(root, "tests/fixtures/web-exercise-solutions.json") + ":/fixtures/solutions.json:ro",
      process.env.WEB_RUNTIME_IMAGE || "tutor-web-runtime:1",
      "node",
      "/fixtures/check.mjs",
      "--container",
    ],
    { stdio: "inherit" },
  );
  if (result.error) process.stderr.write(result.error.message + "\n");
  process.exit(result.status ?? 1);
}
const { run } = await import("file:///opt/web/run.cjs");
const templates = JSON.parse(readFileSync("/fixtures/templates.json", "utf8"));
const solutions = JSON.parse(readFileSync("/fixtures/solutions.json", "utf8"));
(async () => {
  let checks = 0;
  for (const template of templates) {
    for (const check of template.checks) {
      try {
        await run(solutions[template.id], check);
        checks++;
      } catch (error) {
        throw new Error(template.id + ": " + check.label + ": " + error.message);
      }
    }
    let starterFails = false;
    for (const check of template.checks) {
      try {
        await run(template.starter, check);
      } catch {
        starterFails = true;
        break;
      }
    }
    if (!starterFails) throw new Error("Starter already passes every check: " + template.id);
    process.stdout.write(template.id + ": solution passes, starter fails\n");
  }
  process.stdout.write("Verified " + templates.length + " exercises / " + checks + " solution checks\n");
})().catch((error) => {
  process.stderr.write(error.message + "\n");
  process.exitCode = 1;
});
