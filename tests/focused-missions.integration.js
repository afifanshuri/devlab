import test from "node:test";
import assert from "node:assert/strict";
import { LabSessions } from "../runner/sessions.js";
import { must } from "../runner/docker.js";

test(
  "a reused Java workspace refreshes checks while retaining unrelated saved files",
  { timeout: 60000 },
  async () => {
    const labs = new LabSessions();
    try {
      const info = await labs.create("hands-java-advanced:46");
      const session = labs.get(info.id);
      await labs.write(session, "Challenge.java", session.lesson.solution);
      await labs.write(
        session,
        "DayPlan.java",
        "old answer: deliberately not valid Java",
      );
      await must(
        [
          "exec",
          "--user",
          "0",
          "--workdir",
          "/",
          "-i",
          session.name,
          "sh",
          "-c",
          `chmod u+w ${session.checks}/Verify.java && cat > ${session.checks}/Verify.java && chmod 444 ${session.checks}/Verify.java`,
        ],
        { input: "public class Verify { broken old check }" },
      );
      assert.equal((await labs.create(session.lesson.id)).id, info.id);
      const result = await labs.check(session);
      assert.equal(result.passed, true, result.output);
      const saved = await labs.command(session, "cat DayPlan.java");
      assert.equal(
        saved.output.trim(),
        "old answer: deliberately not valid Java",
      );
    } finally {
      await labs.clear();
    }
  },
);
