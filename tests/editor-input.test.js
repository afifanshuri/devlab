import test from "node:test";
import assert from "node:assert/strict";
import { newline, editKey } from "../src/editor-input.js";
test("Enter preserves indentation and opens an indented block between braces", () => {
  assert.deepEqual(newline("  call();", 9), { text: "\n  ", cursor: 12 });
  assert.deepEqual(newline("  if (ok) {}", 11), {
    text: "\n    \n  ",
    cursor: 16,
  });
  assert.equal(newline("\tvalue", 6).text, "\n\t");
  assert.equal(newline("if ready; then", 14).text, "\n  ");
  assert.equal(newline("BEGIN", 5).text, "\n  ");
  assert.equal(newline("SELECT name", 11).text, "\n");
  assert.equal(newline("  old value", 5, 11).text, "\n  ");
});
test("Tab and Shift+Tab indent and dedent selected code", () => {
  const field = {
    value: "one\ntwo",
    selectionStart: 0,
    selectionEnd: 7,
    setRangeText(text, start, end) {
      this.value = this.value.slice(0, start) + text + this.value.slice(end);
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
  };
  const event = { key: "Tab", target: field, preventDefault() {} };
  editKey(event);
  assert.equal(field.value, "  one\n  two");
  editKey({ ...event, shiftKey: true });
  assert.equal(field.value, "one\ntwo");
});
