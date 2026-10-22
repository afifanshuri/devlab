import { state } from "./state.js";
import { allLessons } from "../curriculum.js?v=linux-answers-2";
const completed = () =>
  allLessons.filter((lesson) => state.records[lesson.id]?.completed).length;
const count = (c) =>
  c.lessons.filter((_, i) => state.records[`${c.id}:${i}`]?.completed).length;
const route = (c) => {
  const next = c.lessons.findIndex(
    (_, i) => !state.records[`${c.id}:${i}`]?.completed,
  );
  return `#lab/${c.id}/${Math.max(0, next)}`;
};

export { completed, count, route };
