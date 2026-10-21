let token;
export const localRunner = () =>
  ["127.0.0.1", "localhost"].includes(location.hostname);
export async function callRunner(operation, data = {}) {
  if (!localRunner())
    throw Error(
      "Real labs run locally. Start Docker Desktop, run npm run setup:labs then npm start, and open http://127.0.0.1:5173.",
    );
  if (!token) {
    const response = await fetch("/api/session");
    const session = await response.json();
    if (!response.ok) throw Error(session.error);
    token = session.token;
  }
  const response = await fetch("/api/" + operation, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Devlab-Token": token },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || "Runner request failed");
  return result;
}
