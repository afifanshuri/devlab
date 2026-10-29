import test from "node:test";
import assert from "node:assert/strict";
import { allLessons } from "../curriculum.js";
import { esc } from "../src/ui.js";
import { exerciseRoles } from "../src/exercise-roles.js";
import {
  exerciseBrief,
  renderExerciseBrief,
} from "../src/views/exercise-brief.js";
const find = (id) => allLessons.find((lesson) => lesson.id === id);

test("every declared exercise class, interface, record and enum has a purpose shown in the mission", () => {
  const types = new Set();
  for (const lesson of allLessons.filter(
    (lesson) => lesson.engine === "java" && lesson.type === "workspace",
  )) {
    const roles = exerciseRoles(lesson);
    assert.ok(roles.length, lesson.id);
    const html = renderExerciseBrief(lesson, lesson.id);
    const mission = html.split("<h2>Sample input and output</h2>")[0];
    for (const role of roles) {
      types.add(role.name);
      assert.ok(role.purpose.length > 25, role.name);
      assert.ok(
        mission.includes(role.name) && mission.includes(role.file),
        lesson.id + ": " + role.name,
      );
      assert.ok(
        mission.includes(esc(role.purpose)),
        lesson.id + ": " + role.name,
      );
    }
  }
  assert.equal(types.size, 117);
});

test("the two Checkout classes get the correct shipping or payment explanation", () => {
  const checkout = (id) =>
    exerciseRoles(find(id)).find((role) => role.name === "Checkout");
  assert.match(
    checkout("hands-java-architecture:1").purpose,
    /shipping charge/,
  );
  assert.match(
    checkout("hands-java-spring-core:0").purpose,
    /payment provider/,
  );
  assert.match(
    exerciseRoles(find("hands-java-spring-core:0")).find(
      (r) => r.name === "ShopConfig",
    ).purpose,
    /chooses the payment provider/,
  );
  const spring = exerciseRoles(find("hands-java-spring-core:0"));
  assert.equal(
    spring.find((role) => role.name === "PaymentGateway").provided,
    true,
  );
  assert.equal(
    spring.find((role) => role.name === "ShopConfig").provided,
    false,
  );
});

test("nested and supplied supporting types are explained without reintroducing unrelated classes", () => {
  assert.ok(
    exerciseRoles(find("hands-java-oop-basics:3")).some(
      (role) => role.name === "Contact",
    ),
  );
  assert.ok(
    exerciseRoles(find("hands-java-algorithm-practice:18")).some(
      (role) => role.name === "Node",
    ),
  );
  assert.deepEqual(
    exerciseRoles(find("hands-java-advanced:46")).map((role) => role.name),
    ["Challenge"],
  );
  assert.match(
    exerciseRoles(find("hands-java-advanced:102")).find(
      (role) => role.name === "Main",
    ).purpose,
    /repeated requests/,
  );
});

test("payment-provider mission explains configuration, interchangeability and test doubles in plain language", () => {
  const task = find("hands-java-spring-core:0");
  const mission = exerciseBrief(task, task.id).mission;
  assert.match(mission, /provider selected in the shop's configuration/);
  assert.match(
    mission,
    /Switching providers must not require changing checkout/,
  );
  assert.match(mission, /fake provider/);
  assert.doesNotMatch(
    mission,
    /@Bean|constructor injection|IllegalArgumentException/,
  );
});

test("collection missions define capacity, range endpoints and the queue's actual mutation", () => {
  assert.match(
    find("hands-java-collection-methods:0").mission,
    /not including.*stop/,
  );
  assert.match(
    find("hands-java-collection-methods:28").mission,
    /Capacity is an input/,
  );
  assert.match(
    find("hands-java-collection-methods:33").mission,
    /remove exactly that one order/,
  );
  assert.match(
    find("hands-java-collection-methods:47").mission,
    /equal to the threshold belongs in the ordinary group/,
  );
});
