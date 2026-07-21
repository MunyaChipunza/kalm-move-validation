#!/usr/bin/env node
import { readFile, readdir, stat } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || process.cwd());
const forbidden = [
  { label: "Wellness", expression: /\bWellness\b/i },
  { label: "Outdoor", expression: /\bOutdoor\b/i },
  { label: "Home", expression: /\bHome\b/i },
  { label: "Brands", expression: /\bBrands\b/i },
  { label: "movement, outdoor routines and everyday living", expression: /movement,\s*outdoor routines and everyday living/i }
];
const textExtensions = new Set([".css", ".csv", ".html", ".htm", ".js", ".json", ".mjs", ".txt", ".webmanifest", ".xml", ".svg"]);
const excludedDirectories = new Set([".git", ".netlify", ".release-output", ".qa", "node_modules", "release", "scripts", "tools"]);

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    values[name] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
  }
  return values;
}

function normalise(path) {
  return path.split(sep).join("/");
}

function isPermittedInternalPath(path, content) {
  const parts = normalise(path).split("/");
  if (parts.some((part) => ["docs", "reports", "archive", "archives"].includes(part.toLowerCase()))) return true;
  const fixtureIndex = parts.findIndex((part) => ["test", "tests"].includes(part.toLowerCase()));
  return fixtureIndex >= 0 && parts[fixtureIndex + 1]?.toLowerCase() === "fixtures" && content.includes("KALM_FORBIDDEN_LEGACY_FIXTURE");
}

async function listFiles(directory) {
  const files = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
      const target = resolve(current, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile() && textExtensions.has(extname(entry.name).toLowerCase())) files.push(target);
    }
  }
  await visit(directory);
  return files;
}

async function scan() {
  const rootStats = await stat(root);
  if (!rootStats.isDirectory()) throw new Error("Scan root is not a directory: " + root);
  const matches = [];
  const files = await listFiles(root);
  for (const file of files) {
    const content = await readFile(file, "utf8");
    const path = normalise(relative(root, file));
    if (isPermittedInternalPath(path, content)) continue;
    for (const rule of forbidden) {
      if (rule.expression.test(content)) matches.push({ path, forbidden: rule.label });
    }
  }
  const result = {
    scanner: "check-forbidden-legacy-storefront",
    root: normalise(root),
    scannedTextFileCount: files.length,
    forbidden: forbidden.map((rule) => rule.label),
    matches,
    status: matches.length === 0 ? "pass" : "fail"
  };
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  if (matches.length) process.exitCode = 1;
}

await scan();
