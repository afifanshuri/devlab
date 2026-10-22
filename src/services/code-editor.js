let library;
function load() {
  return (library ??= (async () => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = new URL("../../vendor/editor/editor.css", import.meta.url).href;
    document.head.append(css);
    window.MonacoEnvironment = {
      getWorker: () =>
        new Worker(
          new URL("../../vendor/editor/editor.worker.js", import.meta.url),
          { type: "module" },
        ),
    };
    return (await import("../../vendor/editor/editor.js")).monaco;
  })().catch((error) => {
    library = null;
    throw error;
  }));
}
// The textarea remains the draft/submission source and a usable loading fallback.
export async function openCodeEditor(textarea, filename, language) {
  const monaco = await load();
  return mountCodeEditor(monaco, textarea, filename, language);
}
export function mountCodeEditor(monaco, textarea, filename, language) {
  if (!textarea.isConnected) throw Error("Exercise navigation changed.");
  const host = document.createElement("div");
  host.className = "monaco-code-editor";
  textarea.after(host);
  const models = new Map();
  let current = filename;
  const model = (name, source) => {
    if (!models.has(name)) {
      const item = monaco.editor.createModel(source, language);
      item.updateOptions({ tabSize: 2, insertSpaces: true });
      models.set(name, item);
    }
    return models.get(name);
  };
  monaco.editor.defineTheme("devlab", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#1a2530",
      "editorLineNumber.foreground": "#8395a5",
    },
  });
  const editor = monaco.editor.create(host, {
    model: model(filename, textarea.value),
    theme: "devlab",
    automaticLayout: true,
    readOnly: textarea.readOnly,
    fontSize: 13,
    fontFamily: "Consolas, monospace",
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: false,
    autoIndent: "full",
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    padding: { top: 16 },
    ariaLabel: "Code editor: " + filename,
    fixedOverflowWidgets: true,
  });
  const change = editor.onDidChangeModelContent(() => {
    textarea.value = editor.getValue();
    textarea.oninput?.();
  });
  textarea.hidden = true;
  return {
    showFile(name, source) {
      if (name !== current) {
        current = name;
        editor.setModel(model(name, source));
      }
      if (editor.getValue() !== source) editor.setValue(source);
      editor.updateOptions({ ariaLabel: "Code editor: " + name });
    },
    setReadOnly: (value) => editor.updateOptions({ readOnly: value }),
    dispose() {
      change.dispose();
      editor.dispose();
      for (const item of models.values()) item.dispose();
      host.remove();
      textarea.hidden = false;
    },
  };
}
