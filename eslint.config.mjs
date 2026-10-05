import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    settings: {
      react: {
        version: "19",
      },
    },
    rules: {
      "no-console": "warn",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/no-explicit-any": "warn",

      "prefer-const": "warn",
      eqeqeq: ["error", "always"],
    },
  },

  // Должен идти ближе к концу.
  prettier,

  globalIgnores([
    ".next/**",
    "out/**",
    "public/monaco/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    ".e2e-dependencies/**",
    "playwright-report/**",
    "test-results/**",
    "e2e-artifacts/**",
    ".agents/**",
  ]),
]);

export default eslintConfig;
