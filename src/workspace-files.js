// Keep legacy single-file drafts readable; multi-file drafts use a versioned envelope.
export const starterFiles = (task) => ({
  [task.filename]: task.starter,
  ...task.editableFiles,
});
export function readDraft(task, draft) {
  const files = starterFiles(task);
  if (draft == null) return files;
  if (!task.editableFiles) return { ...files, [task.filename]: draft };
  try {
    const saved = JSON.parse(draft);
    if (saved.version === 1 && saved.files && typeof saved.files === "object")
      for (const name of Object.keys(files))
        if (
          typeof saved.files[name] === "string" &&
          saved.files[name].length <= 64000
        )
          files[name] = saved.files[name];
  } catch {
    /* Ignore malformed multi-file drafts and restore safe starters. */
  }
  return files;
}
export const writeDraft = (task, files) =>
  task.editableFiles
    ? JSON.stringify({ version: 1, files })
    : files[task.filename];
export const solutionFiles = (task) => ({
  [task.filename]: task.solution,
  ...task.solutionFiles,
});
export function hasChanges(task, files) {
  const initial = starterFiles(task);
  return Object.entries(files).some(
    ([name, source]) => source.trim() && source.trim() !== initial[name].trim(),
  );
}
