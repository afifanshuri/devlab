// A bounded comparator, not a shell: commands are never executed.
function commandTokens(value) {
  value = value.trim();
  if (/[\r\n]/.test(value)) return null;
  const tokens = [];
  const pattern = /\s*(?:'([^']*)'|"([^"\\$`]*)"|([^\s"'\\;&|<>`$(){}]+))/y;
  let offset = 0;
  while (offset < value.length) {
    pattern.lastIndex = offset;
    const match = pattern.exec(value);
    if (!match) return null;
    tokens.push(match[1] ?? match[2] ?? match[3]);
    offset = pattern.lastIndex;
    if (offset < value.length && !/\s/.test(value[offset])) return null;
  }
  return tokens;
}
function normalizeAnswer(task, answer) {
  const value = answer.trim();
  if (task.answerFormat === "command") {
    const tokens = commandTokens(value);
    if (!tokens) return null;
    // These ss flags are independent; case remains significant.
    if (
      tokens[0] === "ss" &&
      tokens.length > 1 &&
      tokens.slice(1).every((t) => /^-[lntp]+$/.test(t))
    )
      return (
        "ss:" +
        tokens.slice(1).join("").replaceAll("-", "").split("").sort().join("")
      );
    return JSON.stringify(tokens);
  }
  if (task.answerFormat === "sequence")
    return value
      .toLowerCase()
      .split(",")
      .map((part) => part.trim())
      .join(",");
  return task.answerFormat === "value" ? value.toLowerCase() : value;
}
export function checkWrittenAnswer(task, answer) {
  if (typeof answer !== "string" || !answer.trim() || answer.length > 512)
    return false;
  const actual = normalizeAnswer(task, answer);
  return (
    actual !== null &&
    task.answers.some((expected) => normalizeAnswer(task, expected) === actual)
  );
}
export function readWrittenAnswer(raw) {
  try {
    const value = JSON.parse(raw);
    if (value?.kind === "written-answer" && typeof value.answer === "string")
      return {
        kind: "written-answer",
        version: 2,
        answer: value.answer.slice(0, 16000),
        submittedAnswer:
          value.version === 2 && value.submittedAnswer === value.answer
            ? value.answer
            : null,
        passed:
          value.version === 2 &&
          value.submittedAnswer === value.answer &&
          value.passed === true,
        revealed: value.version === 2 && value.revealed === true,
      };
  } catch {
    /* Malformed drafts start blank. Compatible old answer text survives. */
  }
  return {
    kind: "written-answer",
    version: 2,
    answer: "",
    submittedAnswer: null,
    passed: false,
    revealed: false,
  };
}
export const editWrittenAnswer = (draft, answer) => ({
  ...draft,
  answer,
  submittedAnswer: null,
  passed: false,
  revealed: false,
});
// Old self-reviews are not graded passes. Raw rows remain intact for backups.
export function savedCompletion(completed, raw) {
  try {
    const draft = JSON.parse(raw);
    if (draft?.kind === "written-answer")
      return (
        !!completed &&
        draft.version === 2 &&
        typeof draft.answer === "string" &&
        !!draft.answer.trim() &&
        draft.submittedAnswer === draft.answer &&
        draft.passed === true
      );
  } catch {
    /* Coding drafts are often plain source text. */
  }
  return !!completed;
}
