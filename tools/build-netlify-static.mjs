import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "dist");
const excludedDirectories = new Set([
  ".git",
  ".netlify",
  ".netlify-runtime",
  ".qa",
  "dist",
  "netlify",
  "node_modules",
  "reports",
  "review",
  "tests",
  "tools"
]);
const excludedFiles = new Set([
  ".git",
  ".env",
  ".gitignore",
  ".netlifyignore",
  "package.json",
  "package-lock.json"
]);

async function copyPublicTree(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    if (entry.isFile() && (excludedFiles.has(entry.name) || entry.name.startsWith(".env."))) continue;
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyPublicTree(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await cp(sourcePath, destinationPath, { force: true });
    } else if ((await stat(sourcePath)).isSymbolicLink()) {
      await cp(sourcePath, destinationPath, { dereference: true, force: true });
    }
  }
}

await rm(output, { recursive: true, force: true });
await copyPublicTree(root, output);
