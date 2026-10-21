import * as store from "../database.js";
import { state } from "./state.js";
import { courses, allLessons } from "../content.js";
const completed = () =>
  Object.values(state.records).filter((x) => x.completed).length;
const count = (c) =>
  c.lessons.filter((_, i) => state.records[`${c.id}:${i}`]?.completed).length;
const route = (c) =>
  `#lab/${c.id}/${Math.min(c.lessons.findIndex((_, i) => !state.records[`${c.id}:${i}`]?.completed) < 0 ? 0 : c.lessons.findIndex((_, i) => !state.records[`${c.id}:${i}`]?.completed), c.lessons.length - 1)}`;

export { completed, count, route };
