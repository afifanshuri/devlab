import { esc } from "../ui.js";
import { exerciseRoles } from "../exercise-roles.js";
import {
  advancedSamples,
  missionOverrides,
} from "../exercise-samples.js?v=mission-roles-1";

export function exerciseBrief(task, key) {
  const story = missionOverrides[key] || task.mission || "";
  const goal = task.goal || task.task;
  const outcome = goal.replace(/^Implement\s+[\w.]+(?:\([^)]*\))?\s*:\s*/, "");
  const mission =
    task.plainMission ||
    (task.engine === "java" && task.type !== "written"
      ? story
      : story.includes(goal)
        ? story
        : `${story} ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`.trim());
  let sample = advancedSamples[key] || task.sample;
  if (!sample && task.type === "written") {
    const format = {
      number: "One number in the stated units and rounding format.",
      command: "One command, without a shell prompt or explanation.",
      path: "One absolute path, preserving its case.",
      sequence: "The requested items in order, separated by commas.",
      output: "The exact printed value or line, preserving case.",
      value: "Only the requested name, value or yes/no answer.",
    };
    sample = {
      input:
        task.sampleOutput ||
        task.code ||
        "Use the situation described in the mission.",
      output: format[task.answerFormat] || "Enter only the requested answer.",
    };
  }
  if (!sample) {
    const example = task.example || "";
    const at = example.indexOf("→");
    sample =
      at >= 0
        ? {
            input: example.slice(0, at).trim(),
            output: example.slice(at + 1).trim(),
          }
        : {
            input:
              task.files && Object.keys(task.files).length
                ? Object.entries(task.files)
                    .map(([name, contents]) => `${name}:\n${contents}`)
                    .join("\n\n")
                : task.seed
                  ? task.seed
                  : "Use the exercise inputs described in the mission and acceptance criteria.",
            output:
              example || "The result described by the acceptance criteria.",
          };
  }
  return {
    mission: [mission, task.workspaceGuide].filter(Boolean).join("\n\n"),
    roles: exerciseRoles(task),
    sample,
    learn: task.learn || [],
    requirements: task.requirements || [goal],
  };
}

export function renderExerciseBrief(task, key) {
  const brief = exerciseBrief(task, key);
  return `<h2>Mission</h2><p class="mission-story">${brief.mission.split("\n\n").map(esc).join('</p><p class="mission-story">')}</p>
    ${brief.roles.length ? `<p class="muted">Who does what in this exercise:</p><ul>${brief.roles.map(({ name, file, purpose, provided }) => `<li><strong>${esc(name)}</strong> (${esc(file)}): ${esc(purpose)}.${provided ? ' <span class="muted">Already provided.</span>' : ""}</li>`).join("")}</ul>` : ""}
    <h2>Sample input and output</h2>
    ${task.outputSource ? `<p class="muted">${esc(task.outputSource)}</p>` : ""}
    <div class="mission-example"><strong>Input</strong><pre ${task.healthCheck ? 'class="diagnostic-output" aria-label="Sample health-check output"' : ""}>${esc(brief.sample.input)}</pre>
    <strong>${task.type === "written" ? "Output format" : "Output"}</strong><pre>${esc(brief.sample.output)}</pre></div>
    <h2>What I’m learning</h2><ul>${brief.learn.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
    <h2>Acceptance criteria</h2><ul class="mission-criteria">${brief.requirements.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}
