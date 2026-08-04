import { readFile, readdir } from "node:fs/promises";
import { join, extname } from "node:path";

const root = process.cwd();
const ignored = new Set([".git", "node_modules", ".netlify", ".netlify-runtime", ".release-output", "release", "tests"]);
const extensions = new Set([".js", ".mjs", ".json", ".toml", ".md", ".html", ".yml", ".yaml"]);
const forbidden = [
  /PAYFAST_MERCHANT_(?:ID|KEY)\s*=\s*["'][^"']+/i,
  /PAYFAST_PASSPHRASE\s*=\s*["'][^"']+/i,
  /merchant_key\s*[:=]\s*["'][a-z0-9]{8,}/i,
  /passphrase\s*[:=]\s*["'][^"']{6,}/i
];
const findings = [];
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) await visit(full);
    else if (extensions.has(extname(entry.name).toLowerCase())) {
      const text = await readFile(full, "utf8");
      if (forbidden.some((pattern) => pattern.test(text))) findings.push(full.slice(root.length + 1));
    }
  }
}
await visit(root);
if (findings.length) {
  console.error(JSON.stringify({ status: "fail", findings }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "pass", scannedFor: "embedded PayFast values", findingCount: 0 }));
