import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const source = join(dirname(require.resolve("monaco-editor")));
await mkdir("public/monaco", { recursive: true });
await cp(source, "public/monaco/vs", { recursive: true });
const worker = (await readdir(join(source, "assets"))).find(
  (name) => name.startsWith("editor.worker-") && name.endsWith(".js"),
);
if (!worker) throw new Error("Monaco editor worker asset not found");
await writeFile(
  "public/monaco/editor.worker.js",
  `import "./vs/assets/${worker}";\nglobalThis.postMessage({ type: "vscode-worker-ready" });\n`,
);

// Keep font-src restricted to self: Monaco's distributed CSS embeds its icon font as data:.
const cssPath = "public/monaco/vs/editor/editor.main.css";
const css = await readFile(cssPath, "utf8");
const embeddedFont = /url\(data:font\/ttf;base64,([A-Za-z0-9+/=]+)\)/;
const font = css.match(embeddedFont);
if (!font) throw new Error("Monaco icon font asset not found");
await writeFile("public/monaco/vs/editor/codicon.ttf", Buffer.from(font[1], "base64"));
await writeFile(cssPath, css.replace(embeddedFont, "url(codicon.ttf)"));
