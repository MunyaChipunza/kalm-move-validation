#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseDocument } from "yaml";

const workflowPaths = [
  ".github/workflows/kalm-production-release.yml",
  ".github/workflows/kalm-production-rollback.yml",
  ".github/workflows/kalm-pr-release-control-validation.yml"
];

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function readPath(object, path) {
  return path.reduce((value, key) => value?.[key], object);
}

for (const path of workflowPaths) {
  const text = await readFile(path, "utf8");
  const document = parseDocument(text, { prettyErrors: true });
  assert(!document.errors.length, `${path} has YAML parse errors: ${document.errors.map((error) => error.message).join("; ")}`);
  const parsed = document.toJSON();
  assert(Boolean(parsed?.jobs), `${path} has no jobs block.`);
  if (path.endsWith("kalm-pr-release-control-validation.yml")) {
    assert(Boolean(readPath(parsed, ["on", "pull_request"])), "PR validation workflow must run on pull_request.");
    assert(!text.includes("environment:"), "PR validation workflow must not access a GitHub environment.");
    assert(!text.includes("NETLIFY_AUTH_TOKEN"), "PR validation workflow must not reference Netlify production secrets.");
    assert(!text.includes("netlify deploy --prod"), "PR validation workflow must not deploy production.");
    assert(!text.includes("restoreSiteDeploy"), "PR validation workflow must not restore production deploys.");
  }
  if (path.endsWith("kalm-production-release.yml")) {
    const paths = readPath(parsed, ["on", "push", "paths"]) || [];
    for (const expected of ["assets/**", "branding/**", "data/**", "404.html", "index.html", "payment-return.html", "thanks.html", "merchandising.js", "route-bootstrap.js", "script.js", "styles.css", "products.json", "netlify.toml", "robots.txt", "sitemap.xml", "site.webmanifest", "llms.txt", "package.json", "package-lock.json", "netlify/**", ".github/workflows/kalm-production-release.yml"]) {
      assert(paths.includes(expected), `Production release push path filter is missing ${expected}.`);
    }
    assert(paths.every((item) => !String(item).startsWith("tools/") && !String(item).startsWith("scripts/") && !String(item).endsWith(".md") && (!String(item).startsWith(".github/") || item === ".github/workflows/kalm-production-release.yml")), "Production release path filter includes non-storefront release-control inputs.");
    assert(text.includes("Resolve approved source commit"), "Production release workflow must resolve the source commit once.");
    assert(text.includes("steps.source.outputs.commit"), "Production release workflow must reuse the resolved source commit output.");
  }
}

if (failures.length) {
  console.error(JSON.stringify({ validationStatus: "fail", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ validationStatus: "pass", workflows: workflowPaths }, null, 2));
