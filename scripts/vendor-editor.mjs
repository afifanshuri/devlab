import path from "node:path";
import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
const dir = new URL("../vendor/editor/", import.meta.url);
await mkdir(dir, { recursive: true });
// Monaco vendors a sanitizer copy; bundle the patched registry version instead.
const sanitizer = {
  name: "patched-dompurify",
  setup(build) {
    build.onResolve({ filter: /dompurify\/dompurify\.js$/ }, () => ({
      path: path.resolve("node_modules/dompurify/dist/purify.es.mjs"),
    }));
  },
};

await build({
  entryPoints: ["scripts/monaco-entry.js"],
  bundle: true,
  plugins: [sanitizer],
  format: "esm",
  splitting: true,
  outdir: "vendor/editor",
  entryNames: "editor",
  chunkNames: "[name]-[hash]",
  minify: true,
  loader: { ".ttf": "file" },
  target: "es2022",
  legalComments: "linked",
});
await build({
  entryPoints: ["node_modules/monaco-editor/esm/vs/editor/editor.worker.js"],
  bundle: true,
  plugins: [sanitizer],
  format: "esm",
  outfile: "vendor/editor/editor.worker.js",
  minify: true,
  target: "es2022",
  legalComments: "linked",
});
await copyFile(
  new URL("../node_modules/monaco-editor/LICENSE", import.meta.url),
  new URL("LICENSE-monaco", dir),
);
console.log(
  "Bundled official Monaco with Java and SQL support; assets are self-hosted.",
);

await copyFile(
  new URL("../node_modules/dompurify/LICENSE", import.meta.url),
  new URL("LICENSE-dompurify", dir),
);
