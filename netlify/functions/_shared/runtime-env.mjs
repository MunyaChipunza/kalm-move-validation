// Netlify exposes the `Netlify` runtime global to serverless and edge
// functions.  Resolve it at call time so this shared module remains safe to
// import in the Node test runner, where that global is deliberately absent.
export function runtimeEnvGet(name) {
  // A deployed Node function receives its current project values through
  // process.env. Prefer that injection over a possibly retained runtime-global
  // snapshot, while preserving the Netlify accessor as a safe fallback.
  const processValue = typeof process !== "undefined" ? process.env?.[name] : undefined;
  if (processValue !== undefined && processValue !== "") return processValue;
  if (typeof Netlify === "undefined" || !Netlify.env?.get) return undefined;
  return Netlify.env.get(name);
}