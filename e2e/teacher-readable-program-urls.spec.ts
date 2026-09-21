import { expect, test } from "@playwright/test";

type ProgramSummary = {
  id: string;
  slug: string;
  title: string;
};

type ProgramDetails = ProgramSummary & {
  modules: Array<{
    id: string;
    title: string;
    topics: Array<{
      id: string;
      slug: string;
      title: string;
    }>;
  }>;
};

test("teacher can use readable program URLs and legacy UUID links", async ({ page }) => {
  test.setTimeout(90_000);

  // --------------------------------------------------
  // 1. Authentication
  // --------------------------------------------------

  await page.goto("/login?next=%2Fteacher%2Fprograms");

  await page.getByLabel("Email", { exact: true }).fill("teacher.demo@tutor.local");

  await page.getByLabel("Пароль", { exact: true }).fill("DemoTeacher123!");

  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page).toHaveURL(/\/teacher\/programs$/);

  // --------------------------------------------------
  // 2. Find an existing program containing topics
  // --------------------------------------------------

  const listResponse = await page.request.get("/api/v1/teacher/programs");

  expect(listResponse.ok()).toBeTruthy();

  const programs = (await listResponse.json()) as ProgramSummary[];

  let selected: ProgramDetails | undefined;

  for (const item of programs) {
    const response = await page.request.get(`/api/v1/teacher/programs/${item.id}`);

    expect(response.ok()).toBeTruthy();

    const details = (await response.json()) as ProgramDetails;

    if (details.modules.some((module) => module.topics.length > 0)) {
      selected = details;
      break;
    }
  }

  expect(selected, "Expected a demo program with topics").toBeDefined();

  const program = selected!;

  expect(program.slug).toBeTruthy();

  const learningModule = program.modules.find((item) => item.topics.length > 0)!;

  const topic = learningModule.topics[0];

  expect(topic.slug).toBeTruthy();

  const programPath = `/teacher/programs/${program.slug}`;

  const topicPath = `${programPath}/topics/${topic.slug}`;

  // --------------------------------------------------
  // 3. Program link must use slug
  // --------------------------------------------------

  await page.goto("/teacher/programs");

  const programLink = page.getByRole("link", {
    name: `Открыть программу: ${program.title}`,
  });

  await expect(programLink).toHaveAttribute("href", programPath);

  await programLink.click();

  await expect.poll(() => new URL(page.url()).pathname).toBe(programPath);

  await expect(
    page.getByRole("heading", {
      name: program.title,
      exact: true,
    }),
  ).toBeVisible();

  // --------------------------------------------------
  // 4. Topic link must use slug
  // --------------------------------------------------

  const modulesSection = page.getByRole("region", {
    name: "Модули программы",
  });

  const moduleItem = modulesSection.locator(":scope > ol > li").filter({
    has: page.getByRole("heading", {
      name: learningModule.title,
      exact: true,
    }),
  });

  await moduleItem
    .getByRole("heading", {
      name: learningModule.title,
      exact: true,
    })
    .click();

  const topicLink = moduleItem.getByRole("link", {
    name: topic.title,
    exact: true,
  });

  await expect(topicLink).toHaveAttribute("href", topicPath);

  await topicLink.click();

  await expect.poll(() => new URL(page.url()).pathname).toBe(topicPath);

  await expect(
    page.getByRole("heading", {
      name: topic.title,
      exact: true,
    }),
  ).toBeVisible();

  // --------------------------------------------------
  // 5. Direct opening of readable topic URL
  // --------------------------------------------------

  await page.reload();

  await expect(
    page.getByRole("heading", {
      name: topic.title,
      exact: true,
    }),
  ).toBeVisible();

  // --------------------------------------------------
  // 6. Legacy program UUID URL
  // --------------------------------------------------

  await page.goto(`/teacher/programs/${program.id}?source=legacy`);

  await expect.poll(() => new URL(page.url()).pathname).toBe(programPath);

  await expect.poll(() => new URL(page.url()).search).toBe("?source=legacy");

  // --------------------------------------------------
  // 7. Legacy program + topic UUID URL
  // --------------------------------------------------

  await page.goto(`/teacher/programs/${program.id}/topics/${topic.id}?source=legacy`);

  await expect.poll(() => new URL(page.url()).pathname).toBe(topicPath);

  await expect.poll(() => new URL(page.url()).search).toBe("?source=legacy");

  await expect(
    page.getByRole("heading", {
      name: topic.title,
      exact: true,
    }),
  ).toBeVisible();
});
