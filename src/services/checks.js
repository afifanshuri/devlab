export function checkStructure(source, rules) {
  const clean = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/--[^\n]*/g, "");
  return rules.map(([label, pattern]) => ({
    label,
    pass: new RegExp(pattern, "i").test(clean),
  }));
}
export function matchesRows(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}
