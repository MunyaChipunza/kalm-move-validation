// Netlify exposes the `Netlify` runtime global to serverless and edge
// functions.  Resolve it at call time so this shared module remains safe to
// import in the Node test runner, where that global is deliberately absent.
export function runtimeEnvGet(name) {
  if (typeof Netlify === "undefined" || !Netlify.env?.get) return undefined;
  return Netlify.env.get(name);
}
