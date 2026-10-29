import test from "node:test";
import assert from "node:assert/strict";
import { allLessons } from "../curriculum.js?v=mission-brief-1";
import {
  learningGroups,
  groupForLesson,
  groupedNavigation,
  lessonRoute,
} from "../src/learning-groups.js";
import { count, route } from "../src/catalog-data.js";
import { state } from "../src/state.js";

test("17 topic groups partition every original exercise without changing its identity or content", () => {
  assert.equal(learningGroups.length, 17);
  assert.deepEqual(
    ["java", "linux", "sql"].map(
      (track) => learningGroups.filter((group) => group.track === track).length,
    ),
    [6, 6, 5],
  );
  const grouped = learningGroups.flatMap((group) => group.lessons);
  assert.equal(grouped.length, allLessons.length);
  assert.equal(
    new Set(grouped.map((lesson) => lesson.id)).size,
    allLessons.length,
  );
  const originals = new Map(allLessons.map((lesson) => [lesson.id, lesson]));
  for (const group of learningGroups) {
    assert.ok(group.sections.length && group.lessons.length);
    assert.deepEqual(
      group.sections.flatMap((section) =>
        section.lessons.map((lesson) => lesson.id),
      ),
      group.lessons.map((lesson) => lesson.id),
    );
    for (const lesson of group.lessons) {
      assert.equal(lesson.track, group.track);
      assert.deepEqual(lesson, originals.get(lesson.id));
      assert.equal(groupForLesson.get(lesson.id), group);
      assert.equal(
        lessonRoute(lesson),
        `#lab/${lesson.course}/${lesson.index}`,
      );
      if (lesson.challengeNumber === 1) {
        const prerequisiteIndex = group.lessons.findIndex(
          (candidate) => candidate.id === lesson.prerequisites[0],
        );
        if (prerequisiteIndex >= 0)
          assert.ok(prerequisiteIndex < group.lessons.indexOf(lesson));
      }
    }
  }
});

test("related initial, advanced and interview work share topic sections", () => {
  const patterns = learningGroups.find((group) => group.id === "java-patterns");
  const singleton = patterns.sections.find(
    (section) => section.title === "Singleton",
  );
  assert.equal(singleton.lessons.length, 5);
  assert.equal(singleton.lessons[0].id, "hands-java-architecture:0");
  assert.equal(
    learningGroups.find((group) => group.id === "java-solid").sections.length,
    5,
  );
  const links = learningGroups
    .find((group) => group.id === "linux-files")
    .sections.find((section) => section.title === "Links & inodes");
  assert.ok(links.lessons.some((lesson) => lesson.advancedTopic));
  assert.ok(links.lessons.some((lesson) => lesson.type === "written"));
  assert.ok(
    links.lessons.some((lesson) => lesson.id === "hands-linux-foundations:1"),
  );
  assert.ok(
    learningGroups
      .find((group) => group.id === "sql-oracle")
      .lessons.every(
        (lesson) =>
          lesson.engine === "oracle" || lesson.diagnosticSystem === "oracle",
      ),
  );
});

test("group navigation crosses original course boundaries and preserves saved progress keys", () => {
  const previousRecords = state.records;
  try {
    for (const group of learningGroups) {
      state.records = {};
      assert.equal(route(group), lessonRoute(group.lessons[0]));
      for (const [i, lesson] of group.lessons.entries()) {
        const navigation = groupedNavigation(lesson.id);
        assert.equal(navigation.index, i);
        assert.equal(navigation.previous, group.lessons[i - 1]);
        assert.equal(navigation.next, group.lessons[i + 1]);
      }
      state.records = {
        [group.lessons[0].id]: { completed: true, draft: "saved answer" },
      };
      assert.equal(count(group), 1);
      assert.equal(route(group), lessonRoute(group.lessons[1]));
      assert.equal(state.records[group.lessons[0].id].draft, "saved answer");
    }
  } finally {
    state.records = previousRecords;
  }
});

test("group overview renders original exercise links and distinguishes answer modes", async () => {
  const oldDocument = globalThis.document,
    oldLocation = globalThis.location;
  const nodes = new Map();
  globalThis.document = {
    querySelector: (selector) => {
      if (!nodes.has(selector)) nodes.set(selector, { innerHTML: "" });
      return nodes.get(selector);
    },
  };
  globalThis.location = { hash: "#group/linux-files" };
  try {
    const { groupSections } = await import("../src/views/learning-group.js");
    const group = learningGroups.find((item) => item.id === "linux-files");
    const html = groupSections(group, group.lessons[0]);
    for (const lesson of group.lessons)
      assert.ok(html.includes(lessonRoute(lesson)));
    assert.match(html, /Terminal/);
    assert.match(html, /Short answer/);
    assert.doesNotMatch(html, /#lab\/linux-files\//);
  } finally {
    globalThis.document = oldDocument;
    globalThis.location = oldLocation;
  }
});
