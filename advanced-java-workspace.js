const word = (name) => new RegExp(`\\b${name}\\b`);
const methodName = (signature) => signature.match(/(\w+)\s*\(/)[1];

// Retain only helpers called by this question, then the Java types they use.
// Support comes from the completed prerequisite, rather than another TODO task.
export function focusedWorkspace(base, topic, index) {
  const current = topic.questions[index];
  const helpers = [];
  let needed = `${current.signature}\n${current.body}\n${current.tests}`;
  for (let i = index - 1; i >= 0; i--) {
    const question = topic.questions[i];
    const name = methodName(question.signature);
    if (
      new RegExp(
        `\\bChallenge::${name}\\b|(?:\\bChallenge\\.|(?<![.\\w]))${name}\\s*\\(`,
      ).test(needed)
    ) {
      helpers.unshift(question);
      needed += `\n${question.signature}\n${question.body}\n${question.tests}`;
    }
  }
  const candidates = {
    ...base.files,
    [base.filename]: base.solution,
    ...base.solutionFiles,
  };
  const files = {};
  let changed;
  do {
    changed = false;
    for (const [file, code] of Object.entries(candidates)) {
      const type = file
        .split("/")
        .at(-1)
        .replace(/\.java$/, "");
      if (!files[file] && word(type).test(needed)) {
        files[file] = code;
        needed += "\n" + code;
        changed = true;
      }
    }
  } while (changed);
  return { current, helpers, files };
}

export function supportDescription(files, helpers) {
  const types = Object.keys(files);
  const parts = [];
  if (types.length)
    parts.push(
      `The related files ${types.join(", ")} are ready to use. You do not need to complete them.`,
    );
  if (helpers.length)
    parts.push(
      "The earlier step needed by this question is already completed in Challenge.java for you to reuse.",
    );
  return parts.join(" ");
}
