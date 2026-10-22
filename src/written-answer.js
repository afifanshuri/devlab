export function readWrittenAnswer(draft, size) {
  try {
    const value = JSON.parse(draft);
    if (value?.kind === "written-answer" && typeof value.answer === "string")
      return {
        kind: "written-answer",
        answer: value.answer.slice(0, 16000),
        reviewing: !!value.answer.trim() && value.reviewing === true,
        checked: Array.from(
          { length: size },
          (_, i) => value.checked?.[i] === true,
        ),
      };
  } catch {
    /* A missing or incompatible draft starts blank. */
  }
  return {
    kind: "written-answer",
    answer: "",
    reviewing: false,
    checked: Array(size).fill(false),
  };
}

export function editWrittenAnswer(draft, answer) {
  return {
    ...draft,
    answer,
    reviewing: false,
    checked: draft.checked.map(() => false),
  };
}

export const canCompleteReview = (draft) =>
  !!draft.answer.trim() &&
  draft.reviewing &&
  draft.checked.length > 0 &&
  draft.checked.every(Boolean);
