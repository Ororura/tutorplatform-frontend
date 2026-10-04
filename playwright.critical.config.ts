import { defineConfig } from "@playwright/test";

import config from "./playwright.config";

export default defineConfig(config, {
  testMatch: [
    "auth-session.spec.ts",
    "accept-student-invite.spec.ts",
    "teacher-students-demo.spec.ts",
    "teacher-program-editor-demo.spec.ts",
    "teacher-material-editor-demo.spec.ts",
    "teacher-program-assignment-demo.spec.ts",
    "teacher-lesson-sessions-demo.spec.ts",
    "student-learning-journey-demo.spec.ts",
    "topic-access-journey.spec.ts",
    "teacher-tasks-homework-demo.spec.ts",
    "execution-journey.spec.ts",
    "current-progress-journey-demo.spec.ts",
    "progress-report-journey-demo.spec.ts",
    "program-duplication-evolution-demo.spec.ts",
    "teacher-content-package-import-demo.spec.ts",
    "content-package-v2-journey.spec.ts",
    "mobile-release-smoke.spec.ts",
    "mobile-public-smoke.spec.ts",
    "browser-security.spec.ts",
  ],
});
