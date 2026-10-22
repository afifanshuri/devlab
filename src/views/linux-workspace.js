import * as store from "../../database.js";
import { state } from "../state.js";
import { $, toast } from "../ui.js";
import { callRunner } from "../services/runner.js";
import { openInteractiveTerminal } from "../services/interactive-terminal.js";

export const linuxPane = (
  available,
) => `<section class="terminal-pane linux-terminal" aria-label="Interactive Linux terminal">
  <div class="workspace-section-header"><strong>&gt;_ LINUX TERMINAL</strong><span id="runner-state">${available ? "CONNECTING…" : "LOCAL RUNNER REQUIRED"}</span></div>
  <div id="interactive-terminal" class="interactive-terminal" aria-label="Linux shell">${available ? "Connecting to your exercise…" : "Start Docker Desktop and the local runner to use Bash and vim."}</div>
  <p class="terminal-help muted">Type commands directly. Edit files with vim &lt;filename&gt; · i starts editing · Esc leaves insert mode · :wq saves and closes · :q! discards changes. Save and close the editor before checking.</p>
  <div class="workspace-actions"><button class="secondary" id="reconnect">Reconnect</button><button class="secondary" id="reset">Reset notes.sh</button><button class="primary" id="check" disabled>Check answer →</button></div>
  <p class="terminal-help muted">Check answer verifies the files and state you create. Scripting missions also test your saved script with different inputs. Reset restores only notes.sh and keeps your other files and container.</p>
  <div id="output" class="console" role="status" aria-live="polite">${available ? "Starting your exercise environment…" : "Open http://127.0.0.1:5173 after running npm start."}</div>
</section>`;

export async function mountLinux(context, available, live) {
  let connected = false,
    changed = false,
    atPrompt = false;
  const output = (text) => {
    if (live()) $("#output").textContent = text;
  };
  const update = () => {
    if (live()) {
      $("#check").disabled =
        !connected || !changed || !atPrompt || context.busy;
      $("#reset").disabled = !connected || !atPrompt || context.busy;
      $("#reconnect").disabled = !available || context.busy;
    }
  };
  const connect = async () => {
    context.busy = true;
    connected = false;
    update();
    context.terminal?.dispose();
    try {
      const info = await callRunner("start", { lessonId: context.key });
      if (!live()) return;
      context.session = info.id;
      const previousDraft = context.files[context.task.filename];
      if (previousDraft && previousDraft !== context.task.starter) {
        const remote = await callRunner("read", {
          id: info.id,
          filename: context.task.filename,
        });
        const oldStarter =
          "# Write your commands here. Check answer runs this script.\n";
        if (
          remote.output === context.task.starter ||
          remote.output === oldStarter
        )
          await callRunner("write", {
            id: info.id,
            filename: context.task.filename,
            source: previousDraft,
          });
      }
      if (!live()) return;
      context.completed = false;
      $("#interactive-terminal").textContent = "";
      const terminal = await openInteractiveTerminal(
        $("#interactive-terminal"),
        info.id,
        {
          onReady: (edited, prompt) => {
            if (!live()) return;
            connected = true;
            changed = edited;
            atPrompt = prompt;
            $("#runner-state").textContent = "CONNECTED · BASH";
            output(
              "Use the terminal to complete the mission, then select Check answer.",
            );
            update();
          },
          onActivity: () => {
            changed = true;
            update();
          },
          onState: (prompt) => {
            atPrompt = prompt;
            update();
          },
          onError: output,
          onExit: () => {
            connected = false;
            context.terminal?.setReadOnly(true);
            if (live() && !context.completed)
              $("#runner-state").textContent =
                "DISCONNECTED · RECONNECT TO CONTINUE";
            update();
          },
        },
      );
      if (!live()) {
        terminal.dispose();
        return;
      }
      context.terminal = terminal;
    } catch (error) {
      output(error.message);
    } finally {
      context.busy = false;
      update();
    }
  };
  $("#reconnect").onclick = () => {
    if (!context.busy) return connect();
  };
  $("#check").onclick = async () => {
    if (context.busy || !connected || !changed || !atPrompt) return;
    context.busy = true;
    context.terminal.setReadOnly(true);
    update();
    try {
      output("Checking your exercise files and state…");
      const result = await callRunner("check", { id: context.session });
      if (result.passed) {
        await store.saveLesson(
          context.key,
          state.records[context.key]?.draft ?? null,
          true,
        );
        state.records = store.progress();
      }
      if (!live()) return;
      context.terminal.write("\n" + result.output + "\n");
      output(
        result.passed
          ? "✓ All task tests passed."
          : "Tests failed. Review the output, fix your files or commands, then try again.",
      );
      $("#output").className =
        "console " + (result.passed ? "success" : "error");
      if (result.passed) {
        context.completed = true;
        connected = false;
        context.session = null;
        $("#runner-state").textContent = "PASSED · CONTAINER DELETED";
        if (live())
          $("#completion").innerHTML =
            '<div class="complete-banner">✓ Exercise complete. Progress saved.</div>';
        toast("Linux mission complete.");
      }
    } catch (error) {
      output(error.message);
    } finally {
      context.busy = false;
      if (live()) {
        context.terminal?.setReadOnly(!connected);
        update();
      }
    }
  };
  $("#reset").onclick = async () => {
    if (context.busy || !connected || !atPrompt) return;
    context.busy = true;
    update();
    try {
      await callRunner("reset", { lessonId: context.key });
      context.files[context.task.filename] = context.task.starter;
      await store.saveLesson(context.key, context.task.starter);
      state.records = store.progress();
      output("notes.sh restored. Other files and the container are unchanged.");
    } catch (error) {
      output(error.message);
    } finally {
      context.busy = false;
      update();
    }
  };
  update();
  if (available) await connect();
}
