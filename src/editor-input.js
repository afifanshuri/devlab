// Small textarea editing helpers: preserve the learner's indentation, not a formatter.
export function newline(value, start, end = start) {
  const before = value.slice(0, start),
    after = value.slice(end);
  const line = before.slice(before.lastIndexOf("\n") + 1);
  const indent = line.match(/^[\t ]*/)[0];
  const opens = /(?:[({\[]|\b(?:then|do|BEGIN|ELSE|LOOP))\s*$/i.test(line);
  const closes = opens && /^\s*[)}\]]/.test(after);
  const insert = "\n" + indent + (opens ? "  " : "");
  return {
    text: insert + (closes ? "\n" + indent : ""),
    cursor: start + insert.length,
  };
}
export function editKey(event, changed = () => {}) {
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey)
    return;
  const field = event.target;
  if (event.key === "Enter") {
    event.preventDefault();
    const edit = newline(field.value, field.selectionStart, field.selectionEnd);
    field.setRangeText(
      edit.text,
      field.selectionStart,
      field.selectionEnd,
      "end",
    );
    field.setSelectionRange(edit.cursor, edit.cursor);
    changed();
  } else if (event.key === "Tab") {
    event.preventDefault();
    const start = field.selectionStart,
      end = field.selectionEnd;
    if (start === end && !event.shiftKey)
      field.setRangeText("  ", start, end, "end");
    else {
      const first = field.value.lastIndexOf("\n", start - 1) + 1;
      const selection = field.value.slice(first, end);
      const lines = selection.split("\n");
      const edits = lines.map((line) =>
        event.shiftKey ? line.replace(/^(?: {1,2}|\t)/, "") : "  " + line,
      );
      const delta = edits[0].length - lines[0].length;
      const text = edits.join("\n");
      field.setRangeText(text, first, end, "end");
      field.setSelectionRange(
        Math.max(first, start + delta),
        first + text.length,
      );
    }
    changed();
  }
}
