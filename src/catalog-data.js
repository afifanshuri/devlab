import { state } from "./state.js";
import { allLessons } from "../curriculum.js?v=health-output-1";
const completed = () =>
  allLessons.filter((lesson) => state.records[lesson.id]?.completed).length;
const count = (c) =>
  c.lessons.filter(
    (_, i) => state.records[c.lessons[i].id || `${c.id}:${i}`]?.completed,
  ).length;
const route = (c) => {
  const next = c.lessons.findIndex(
    (_, i) => !state.records[c.lessons[i].id || `${c.id}:${i}`]?.completed,
  );
  const index = Math.max(0, next),
    lesson = c.lessons[index];
  return `#lab/${lesson.course || c.id}/${lesson.index ?? index}`;
};

export { completed, count, route };
