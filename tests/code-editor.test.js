import test from "node:test";
import assert from "node:assert/strict";
import { mountCodeEditor } from "../src/services/code-editor.js";

test("editor changes feed draft submissions, tabs preserve models, reset and read-only work", () => {
  const previous = globalThis.document;
  let removed = false,
    listener,
    disposed = 0,
    changes = 0,
    instance;
  globalThis.document = {
    createElement: () => ({
      remove() {
        removed = true;
      },
    }),
  };
  const textarea = {
    isConnected: true,
    value: "starter",
    readOnly: true,
    after() {},
    oninput() {
      changes++;
    },
  };
  const models = [];
  const monaco = {
    editor: {
      defineTheme() {},
      createModel(value, language) {
        const model = {
          value,
          language,
          updateOptions(options) {
            this.options = options;
          },
          dispose() {
            disposed++;
          },
        };
        models.push(model);
        return model;
      },
      create(host, options) {
        instance = {
          model: options.model,
          options,
          getValue() {
            return this.model.value;
          },
          setValue(value) {
            this.model.value = value;
            listener();
          },
          setModel(model) {
            this.model = model;
          },
          updateOptions(options) {
            Object.assign(this.options, options);
          },
          onDidChangeModelContent(callback) {
            listener = callback;
            return {
              dispose() {
                listener = null;
              },
            };
          },
          dispose() {},
        };
        return instance;
      },
    },
  };
  try {
    const editor = mountCodeEditor(monaco, textarea, "Main.java", "java");
    assert.equal(textarea.hidden, true);
    assert.equal(instance.options.readOnly, true);
    instance.setValue("my answer");
    assert.equal(textarea.value, "my answer");
    assert.equal(changes, 1);
    editor.showFile("Other.java", "second starter");
    editor.showFile("Main.java", "my answer");
    assert.equal(instance.model, models[0]);
    assert.equal(models.length, 2);
    assert.equal(instance.model.options.tabSize, 2);
    editor.setReadOnly(false);
    assert.equal(instance.options.readOnly, false);
    editor.showFile("Main.java", "starter");
    assert.equal(textarea.value, "starter");
    editor.dispose();
    assert.equal(textarea.hidden, false);
    assert.equal(removed, true);
    assert.equal(disposed, 2);
    assert.equal(listener, null);
  } finally {
    globalThis.document = previous;
  }
});
