import type { WebFile, WebFiles } from "@/shared/lib/web-exercise";

export type TypingStep = {
  hint: string;
  text: string;
  file: WebFile;
  // Insert before an existing delimiter; an empty delimiter means the end of the file.
  before: string;
  prefix: string;
  suffix: string;
};

export type TypingExercise = {
  id: string;
  title: string;
  language: "HTML" | "CSS" | "JavaScript";
  description: string;
  initial: WebFiles;
  steps: readonly TypingStep[];
};

const canvas =
  "body { margin: 0; padding: 32px; font-family: system-ui, sans-serif; background: #f1f5f9; color: #0f172a; }\n";
const declaration = (hint: string, text: string): TypingStep => ({
  hint,
  text,
  file: "css",
  before: "}\n",
  prefix: "  ",
  suffix: "\n",
});

export const typingExercises: readonly TypingExercise[] = [
  {
    id: "css-button",
    title: "Оформление кнопки",
    language: "CSS",
    description: "Превратите обычную кнопку в синюю кнопку с удобными отступами и мягкими углами.",
    initial: {
      html: '<button class="button">Нажми меня</button>',
      css: canvas + ".button {\n}\n",
      javascript: "",
    },
    steps: [
      declaration("Задайте синий фон кнопки.", "background: #2563eb;"),
      declaration("Сделайте текст белым, чтобы он выделялся на синем фоне.", "color: white;"),
      declaration("Добавьте отступы: 12 пикселей сверху и снизу, 24 — по бокам.", "padding: 12px 24px;"),
      declaration("Скруглите углы кнопки на 8 пикселей.", "border-radius: 8px;"),
    ],
  },
  {
    id: "css-card",
    title: "Оформление карточки",
    language: "CSS",
    description: "Создайте светлую карточку с рамкой, отступами и тенью.",
    initial: {
      html: '<article class="card"><h2>Мой первый сайт</h2><p>Учусь создавать интерфейсы.</p></article>',
      css: canvas + ".card {\n}\n",
      javascript: "",
    },
    steps: [
      declaration("Задайте белый фон карточки.", "background: white;"),
      declaration("Отодвиньте содержимое от краёв на 24 пикселя.", "padding: 24px;"),
      declaration("Добавьте тонкую светлую рамку.", "border: 1px solid #cbd5e1;"),
      declaration("Скруглите углы карточки.", "border-radius: 16px;"),
      declaration("Добавьте мягкую тень под карточкой.", "box-shadow: 0 8px 24px #0f172a1a;"),
    ],
  },
  {
    id: "css-flex",
    title: "Центрирование через Flexbox",
    language: "CSS",
    description: "Расположите два элемента по центру контейнера и добавьте расстояние между ними.",
    initial: {
      html: '<div class="container"><span>HTML</span><span>CSS</span></div>',
      css:
        canvas +
        "span { padding: 12px; background: #dbeafe; border-radius: 8px; }\n.container {\n  min-height: 220px;\n  border: 2px dashed #94a3b8;\n}\n",
      javascript: "",
    },
    steps: [
      declaration("Включите Flexbox для контейнера.", "display: flex;"),
      declaration("Разместите элементы по центру главной, горизонтальной оси.", "justify-content: center;"),
      declaration("Выровняйте элементы по центру поперечной, вертикальной оси.", "align-items: center;"),
      declaration("Оставьте между элементами 16 пикселей.", "gap: 16px;"),
    ],
  },
  {
    id: "html-card",
    title: "Сборка HTML-карточки",
    language: "HTML",
    description: "Наполните карточку заголовком, описанием и ссылкой на раздел внутри неё.",
    initial: {
      html: '<article class="card">\n</article>',
      css: canvas + ".card { padding: 24px; background: white; border-radius: 16px; }\na { color: #2563eb; }",
      javascript: "",
    },
    steps: [
      {
        hint: "Добавьте заголовок второго уровня — название карточки.",
        text: "<h2>Мой первый сайт</h2>",
        file: "html",
        before: "</article>",
        prefix: "  ",
        suffix: "\n",
      },
      {
        hint: "Добавьте абзац с описанием. Атрибут id даст ссылке адрес внутри карточки.",
        text: '<p id="about">Учусь создавать интерфейсы.</p>',
        file: "html",
        before: "</article>",
        prefix: "  ",
        suffix: "\n",
      },
      {
        hint: "Добавьте ссылку на описание: #about указывает на элемент с id about.",
        text: '<a href="#about">Об обучении</a>',
        file: "html",
        before: "</article>",
        prefix: "  ",
        suffix: "\n",
      },
    ],
  },
  {
    id: "js-counter",
    title: "Счётчик на JavaScript",
    language: "JavaScript",
    description: "Оживите кнопку: каждое нажатие будет увеличивать число на единицу.",
    initial: {
      html: '<p>Нажатий: <strong id="count">0</strong></p>\n<button id="increment">Увеличить</button>',
      css: canvas + "button { padding: 12px 24px; border: 0; border-radius: 8px; background: #2563eb; color: white; }",
      javascript: "",
    },
    steps: [
      {
        hint: "Создайте переменную для количества нажатий, начиная с нуля.",
        text: "let count = 0;",
        file: "javascript",
        before: "",
        prefix: "",
        suffix: "\n",
      },
      {
        hint: "Найдите элемент, в котором показано число, по его id.",
        text: 'const output = document.querySelector("#count");',
        file: "javascript",
        before: "",
        prefix: "",
        suffix: "\n",
      },
      {
        hint: "Найдите кнопку увеличения по её id.",
        text: 'const button = document.querySelector("#increment");',
        file: "javascript",
        before: "",
        prefix: "",
        suffix: "\n",
      },
      {
        hint: "Добавьте обработчик нажатия: увеличьте число и выведите его. Отступы внутри функции наберите двумя пробелами.",
        text: 'button.addEventListener("click", () => {\n  count += 1;\n  output.textContent = String(count);\n});',
        file: "javascript",
        before: "",
        prefix: "",
        suffix: "\n",
      },
      {
        hint: "Замените текст кнопки на «Ещё +1», чтобы её действие было понятно.",
        text: 'button.textContent = "Ещё +1";',
        file: "javascript",
        before: "",
        prefix: "",
        suffix: "\n",
      },
    ],
  },
];

export function stepInsertion(files: WebFiles, step: TypingStep) {
  const source = files[step.file];
  // The last closing delimiter belongs to the exercise's target block, after the shared canvas styles.
  const offset = step.before ? source.lastIndexOf(step.before) : source.length;
  if (offset < 0) throw new Error("Не найдено место вставки шага");
  return { before: source.slice(0, offset) + step.prefix, after: step.suffix + source.slice(offset) };
}

export function completedFiles(exercise: TypingExercise, completedSteps: number): WebFiles {
  const files = { ...exercise.initial };
  for (const step of exercise.steps.slice(0, completedSteps)) {
    const insertion = stepInsertion(files, step);
    files[step.file] = insertion.before + step.text + insertion.after;
  }
  return files;
}
