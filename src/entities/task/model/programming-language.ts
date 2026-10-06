import type { components } from "@/shared/api/generated/schema";
export type ProgrammingLanguage = components["schemas"]["ProgrammingLanguage"];
export const programmingLanguageLabels: Record<ProgrammingLanguage, string> = { PYTHON: "Python", JAVA: "Java" };
export const javaStarterCode =
  "public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n";
