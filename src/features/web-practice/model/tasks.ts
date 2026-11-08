import { type WebFile, type WebFiles } from "@/shared/lib/web-exercise";
import type { TypingExercise, TypingStep } from "@/features/code-typing/model/exercises";

export const practiceTechnologies = {
  all: "HTML + CSS + JavaScript",
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
} as const;
export type PracticeTechnology = keyof typeof practiceTechnologies;
export type PracticeTask = {
  id: string;
  title: string;
  brief: string;
  requirements: readonly string[];
  editableFiles: readonly WebFile[];
  starter: WebFiles;
  solution: WebFiles;
  typing: TypingExercise;
};

const families = [
  {
    title: "Каталог курсов",
    intro: "Выберите направление для следующего занятия.",
    items: ["Основы HTML", "Красивый CSS", "Первый JavaScript"],
    action: "Добавить",
    kind: "catalog",
  },
  {
    title: "Афиша мастер-классов",
    intro: "Найдите интересное событие и начните учиться.",
    items: ["Дизайн интерфейсов", "Адаптивная вёрстка", "Работа с DOM"],
    action: "Подробнее",
    kind: "search",
  },
  {
    title: "Портфолио разработчика",
    intro: "Небольшие проекты, созданные с вниманием к деталям.",
    items: ["Страница студии", "Магазин книг", "Личный блог"],
    action: "Смотреть проект",
    kind: "theme",
  },
] as const;
const palettes = ["#2563eb", "#7c3aed", "#0f766e", "#be123c", "#c2410c", "#0369a1"];
const subjects = ["Старт", "Практика", "Мастерская", "Лаборатория", "Открытие", "Импульс"];
const files: readonly WebFile[] = ["html", "css", "javascript"];

function fragment(file: WebFile, hint: string, text: string): TypingStep {
  return {
    file,
    hint,
    text,
    before: file === "html" ? "</div>" : "",
    prefix: file === "html" ? "  " : "",
    suffix: "\n",
  };
}

function documentHtml(body: string, title: string) {
  return `<!doctype html>\n<html lang="ru">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${title}</title>\n  <link rel="stylesheet" href="styles.css">\n  <script src="script.js" defer></script>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
}

/** A reproducible, unbounded sequence of parameterized tasks, without a network or AI service. */
export function createPracticeTask(technology: PracticeTechnology, seed: number, position: number): PracticeTask {
  const variant = (seed >>> 0) + position;
  const family = families[variant % families.length];
  const cycle = Math.floor(variant / families.length);
  const color = palettes[cycle % palettes.length];
  const gap = 12 + (cycle % 5) * 4;
  const padding = 16 + (Math.floor(cycle / 5) % 4) * 4;
  const radius = 8 + (Math.floor(cycle / 20) % 4) * 4;
  const breakpoint = 600 + (Math.floor(cycle / 80) % 4) * 40;
  const brand = subjects[Math.floor(cycle / 320) % subjects.length];
  const increment = 1 + (cycle % 3);
  const heading = `${family.title} «${brand}»`;
  const title = `${heading} · вариант ${position + 1}`;
  const header = `<header class="hero">\n  <p class="eyebrow">${brand}</p>\n  <h1>${heading}</h1>\n  <p>${family.intro}</p>\n</header>`;
  const cards = family.items
    .map(
      (item, i) =>
        `<article class="card">\n  <span class="tag">0${i + 1}</span>\n  <h2>${item}</h2>\n  <p>От идеи до готовой страницы — шаг за шагом.</p>\n  <button class="add" type="button">${family.action}</button>\n</article>`,
    )
    .join("\n");
  const tools =
    family.kind === "catalog"
      ? '<p>Выбрано: <strong id="total" aria-live="polite">0</strong></p>'
      : family.kind === "search"
        ? '<label for="search">Поиск мастер-класса</label>\n<input id="search" type="search" placeholder="Введите название">'
        : '<button id="theme" type="button" aria-pressed="false">Тёмная тема</button>';
  const main = `<main>\n  <section class="tools" aria-label="Управление">\n${tools}\n  </section>\n  <section class="grid" aria-label="Карточки">\n${cards}\n  </section>\n</main>`;
  const footer = `<footer><p>${brand} · Учимся создавать веб-страницы</p><a href="#top">Наверх</a></footer>`;
  const emptyBody = '<div class="page" id="top">\n</div>';
  const htmlSteps = [
    fragment("html", "Соберите шапку: название проекта, главный заголовок и описание.", header),
    fragment("html", "Добавьте основное содержимое: управление и три смысловые карточки с кнопками.", main),
    fragment("html", "Завершите страницу подвалом и ссылкой к началу страницы.", footer),
  ];
  const body = `<div class="page" id="top">\n  ${header}\n  ${main}\n  ${footer}\n</div>`;
  const baseCss = "* { box-sizing: border-box; }\n[hidden] { display: none !important; }\n";
  const cssSteps = [
    fragment(
      "css",
      "Задайте странице светлый фон, читаемый текст и системный шрифт.",
      "body { margin: 0; background: #f1f5f9; color: #0f172a; font-family: system-ui, sans-serif; }",
    ),
    fragment(
      "css",
      "Ограничьте ширину страницы и выровняйте её по центру.",
      `.page { max-width: 1080px; margin: 0 auto; padding: ${padding}px; }`,
    ),
    fragment(
      "css",
      "Выделите шапку и отделите её от карточек.",
      `.hero { padding: 24px 0; }\n.eyebrow, a { color: ${color}; }\nh1 { font-size: 32px; }`,
    ),
    fragment(
      "css",
      "Разместите карточки в три равные колонки с заданным промежутком.",
      `.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: ${gap}px; }`,
    ),
    fragment(
      "css",
      "Создайте белые карточки с внутренними отступами, рамкой и скруглением.",
      `.card { background: white; padding: ${padding}px; border: 1px solid #cbd5e1; border-radius: ${radius}px; }`,
    ),
    fragment(
      "css",
      "Оформите кнопки, поле ввода и заметный фокус для работы с клавиатурой.",
      `button { background: ${color}; color: white; border: 0; border-radius: ${radius}px; padding: 12px 20px; cursor: pointer; }\ninput { padding: 12px; border: 1px solid #64748b; border-radius: ${radius}px; max-width: 100%; }\n:focus-visible { outline: 3px solid ${color}; outline-offset: 3px; }\n.tools { margin-bottom: 24px; }\nfooter { margin-top: 32px; }`,
    ),
    fragment(
      "css",
      "Сделайте одну колонку на узком экране; подготовьте цвета для переключения темы.",
      `@media (max-width: ${breakpoint}px) { .grid { grid-template-columns: 1fr; } }\nbody.dark { background: #0f172a; color: #f8fafc; }\nbody.dark .card { background: #1e293b; }`,
    ),
  ];
  const javascriptSteps =
    family.kind === "catalog"
      ? [
          fragment("javascript", "Создайте переменную для количества выбранных курсов.", "let selected = 0;"),
          fragment(
            "javascript",
            "Найдите элемент, в котором выводится количество.",
            'const total = document.querySelector("#total");',
          ),
          fragment(
            "javascript",
            `На каждой кнопке добавления увеличивайте количество на ${increment} и обновляйте текст.`,
            `document.querySelectorAll(".add").forEach((button) => {\n  button.addEventListener("click", () => {\n    selected += ${increment};\n    total.textContent = String(selected);\n  });\n});`,
          ),
        ]
      : family.kind === "search"
        ? [
            fragment("javascript", "Найдите поле поиска.", 'const search = document.querySelector("#search");'),
            fragment(
              "javascript",
              "Получите список карточек для фильтрации.",
              'const cards = document.querySelectorAll(".card");',
            ),
            fragment(
              "javascript",
              "При вводе оставляйте только карточки, заголовок которых содержит запрос без учёта регистра.",
              'search?.addEventListener("input", () => {\n  const query = search.value.trim().toLowerCase();\n  cards.forEach((card) => {\n    card.hidden = !card.querySelector("h2").textContent.toLowerCase().includes(query);\n  });\n});',
            ),
          ]
        : [
            fragment("javascript", "Найдите кнопку смены темы.", 'const toggle = document.querySelector("#theme");'),
            fragment(
              "javascript",
              "По нажатию переключайте тёмную тему и сообщайте о состоянии кнопки.",
              'toggle?.addEventListener("click", () => {\n  const enabled = document.body.classList.toggle("dark");\n  toggle.setAttribute("aria-pressed", String(enabled));\n});',
            ),
          ];
  const css = baseCss + cssSteps.map((step) => step.text).join("\n");
  const javascript = javascriptSteps.map((step) => step.text).join("\n") + "\n";
  const solution = { html: documentHtml(body, heading), css, javascript };
  const focus = technology === "all" ? files[position % files.length] : technology;
  const typingInitial = {
    html: focus === "html" ? emptyBody : body,
    css: focus === "css" ? baseCss : css,
    javascript: focus === "javascript" ? "" : javascript,
  };
  const behavior =
    family.kind === "catalog"
      ? `Нажатие любой кнопки «Добавить» увеличивает общий счётчик на ${increment}.`
      : family.kind === "search"
        ? "Поиск фильтрует карточки по заголовку без учёта регистра; пустой запрос показывает все карточки."
        : "Кнопка переключает светлую и тёмную темы и обновляет aria-pressed.";
  const htmlRequirements = [
    "В документе указаны язык ru, кодировка UTF-8 и viewport; подключены styles.css и script.js.",
    `Есть шапка с h1 «${heading}», main с тремя article, заголовками h2 и кнопками, а также footer со ссылкой наверх.`,
  ];
  const cssRequirements = [
    `Ширина содержимого — не более 1080px; отступы страницы и карточек — ${padding}px.`,
    `Три равные колонки, промежуток ${gap}px; при ширине до ${breakpoint}px — одна колонка.`,
    `Белые карточки с рамкой #cbd5e1 и скруглением ${radius}px; основной цвет кнопок — ${color}.`,
    "Поля и кнопки доступны с клавиатуры; фокус заметен, на узком экране нет горизонтальной прокрутки.",
  ];
  const requirements = [
    ...(technology === "all" || technology === "html" ? htmlRequirements : []),
    ...(technology === "all" || technology === "css" ? cssRequirements : []),
    ...(technology === "all" || technology === "javascript" ? [behavior] : []),
  ];
  return {
    id: `${technology}:${seed}:${position}`,
    title,
    brief:
      technology === "all"
        ? "Сверстайте адаптивную страницу по образцу и добавьте интерактивность. Все три файла доступны для редактирования."
        : `Отработайте ${practiceTechnologies[technology]} на готовой странице. Остальные файлы предоставлены как основа и доступны только для чтения.`,
    requirements,
    editableFiles: technology === "all" ? files : [technology],
    starter: {
      html: documentHtml(technology === "all" || technology === "html" ? emptyBody : body, heading),
      css: technology === "all" || technology === "css" ? baseCss : css,
      javascript: technology === "all" || technology === "javascript" ? "" : javascript,
    },
    solution,
    typing: {
      id: `${technology}:${seed}:${position}`,
      title,
      description: `Практика ${practiceTechnologies[focus]}`,
      language: practiceTechnologies[focus],
      initial: typingInitial,
      steps: focus === "html" ? htmlSteps : focus === "css" ? cssSteps : javascriptSteps,
    },
  };
}

/** The preview inlines these two local files; keep their real connections in the editor. */
export function projectPreviewFiles(source: WebFiles): WebFiles {
  return {
    ...source,
    html: source.html
      .replace(/<link\b(?=[^>]*\bhref\s*=\s*["'](?:\.\/)?styles\.css["'])[^>]*>/gi, "")
      .replace(/<script\b(?=[^>]*\bsrc\s*=\s*["'](?:\.\/)?script\.js["'])[^>]*>\s*<\/script\s*>/gi, ""),
  };
}
