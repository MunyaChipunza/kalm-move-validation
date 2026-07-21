#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { createReadStream } from "node:fs";
import { access, copyFile, cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, relative, resolve } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const mode = args.mode || "preflight";
const publishDir = resolve(root, args["publish-dir"] || ".release-output/kalm-production");
const manifestPath = resolve(root, "release/kalm-production-manifest.json");
const productionBranch = args.branch || "master";
const requiredRoutes = ["/", "/ks-active", "/archive-sale", "/kalm-move", "/products/kalm-signature-oversized-tee"];
const forbidden = ["Wellness", "Outdoor", "Home", "Brands", "movement, outdoor routines and everyday living"];
const productionRemote = "https://github.com/MunyaChipunza/kalm-move-validation";

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
    parsed[name] = value;
  }
  return parsed;
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function shell(command, parameters) {
  const { stdout } = await execFile(command, parameters, { cwd: root, windowsHide: true });
  return stdout.trim();
}

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function hashFile(path) {
  return hashBuffer(await readFile(path));
}

async function listFiles(directory) {
  const files = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.isFile()) files.push(full);
    }
  }
  await visit(directory);
  return files;
}

async function copyCandidate() {
  await rm(publishDir, { recursive: true, force: true });
  await mkdir(publishDir, { recursive: true });
  const allowedDirectories = ["assets", "branding", "data"];
  const allowedRootExtensions = new Set([".html", ".js", ".css", ".json", ".xml", ".txt", ".ico", ".webmanifest"]);
  for (const name of allowedDirectories) {
    const source = join(root, name);
    if (await exists(source)) await cp(source, join(publishDir, name), { recursive: true });
  }
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isFile() || !allowedRootExtensions.has(extname(entry.name).toLowerCase())) continue;
    await copyFile(join(root, entry.name), join(publishDir, entry.name));
  }
}

function normaliseRemote(value) {
  return value.trim().replace(/^git@github\.com:/, "https://github.com/").replace(/^https?:\/\/[^@/]+@github\.com\//, "https://github.com/").replace(/\.git$/, "").replace(/\/$/, "");
}

async function inspectGit(failures) {
  const status = await shell("git", ["status", "--porcelain"]);
  const remote = normaliseRemote(await shell("git", ["remote", "get-url", "origin"]));
  const head = await shell("git", ["rev-parse", "HEAD"]);
  const expectedCommit = args.commit || head;
  const originBranch = await shell("git", ["rev-parse", `origin/${productionBranch}`]);
  const treeSha = await shell("git", ["rev-parse", `${head}^{tree}`]);
  assert(status.length === 0, "Working tree is dirty.", failures);
  assert(remote === productionRemote, `Unexpected repository remote: ${remote}`, failures);
  assert(/^[a-f0-9]{40}$/i.test(expectedCommit), "A full 40-character source commit SHA is required.", failures);
  assert(head === expectedCommit, "Checked-out commit does not match the approved source commit.", failures);
  assert(originBranch === expectedCommit, `Approved source commit is not the current ${productionBranch} head.`, failures);
  return { head, treeSha, remote, status: status.length === 0 ? "clean" : "dirty" };
}

function redirectAssertions(toml, failures) {
  const redirectCount = (toml.match(/^\[\[redirects\]\]$/gm) || []).length;
  assert(redirectCount >= 12, "Redirect-rule count is implausibly low.", failures);
  for (const expected of ["/products/*", "/collections/*", "/ks-active", "/archive-sale", "/kalm-move"]) {
    assert(toml.includes(`from = \"${expected}\"`), `Expected redirect rule is missing: ${expected}`, failures);
  }
  return redirectCount;
}

async function inspectCandidate(failures) {
  const sourceTomlPath = join(root, "netlify.toml");
  const sourceToml = await exists(sourceTomlPath) ? await readFile(sourceTomlPath, "utf8") : "";
  assert(sourceToml.length > 0, "netlify.toml is missing.", failures);
  const redirectCount = redirectAssertions(sourceToml, failures);
  const mustExist = ["index.html", "script.js", "styles.css", "products.json", "route-bootstrap.js", "assets"];
  for (const item of mustExist) assert(await exists(join(publishDir, item)), `Expected build asset is missing: ${item}`, failures);
  const files = await listFiles(publishDir);
  assert(files.length >= 50, `Candidate has an implausibly small file count (${files.length}).`, failures);
  assert(!(files.length === 1 && relative(publishDir, files[0]) === "index.html"), "Candidate contains only index.html.", failures);
  assert(!files.some((file) => relative(publishDir, file).startsWith("reports")), "Private reports are present in the publish directory.", failures);
  assert(!files.some((file) => file.endsWith(".map")), "Source maps are present in the publish directory.", failures);
  const catalogue = JSON.parse(await readFile(join(publishDir, "products.json"), "utf8"));
  const products = Array.isArray(catalogue) ? catalogue : catalogue.products;
  assert(Array.isArray(products) && products.length > 0, "Catalogue validation failed: products array is missing.", failures);
  const tee = products?.find((product) => product.slug === "kalm-signature-oversized-tee");
  assert(Boolean(tee), "Catalogue validation failed: Signature Tee is missing.", failures);
  if (tee) {
    assert(tee.title === "KALM Signature Oversized Tee", "Signature Tee title is incorrect.", failures);
    assert(Number(tee.price) === 699, "Signature Tee price is not R699.", failures);
    assert(tee.colors?.includes("Black") && tee.colors?.includes("White"), "Signature Tee Black/White variants are missing.", failures);
  }
  const variantCount = products?.reduce((sum, product) => sum + (product.variants?.length || 0), 0) || 0;
  const criticalAssetHashes = {};
  for (const asset of ["index.html", "script.js", "styles.css", "products.json"]) {
    const path = join(publishDir, asset);
    if (await exists(path)) criticalAssetHashes[asset] = await hashFile(path);
  }
  return { files, products, variantCount, redirectCount, criticalAssetHashes };
}

function contentType(path) {
  return ({ ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon" })[extname(path).toLowerCase()] || "application/octet-stream";
}

async function startStaticServer(directory) {
  const shortRouteRedirects = { "/ks-active": "/collections/ks-active", "/archive-sale": "/collections/sale", "/kalm-move": "/brand/kalm-move" };
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://localhost");
      if (shortRouteRedirects[url.pathname]) {
        response.writeHead(302, { location: shortRouteRedirects[url.pathname] });
        response.end();
        return;
      }
      const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
      const target = resolve(directory, `.${requested}`);
      if (!target.startsWith(`${directory}${process.platform === "win32" ? "\\" : "/"}`) && target !== join(directory, "index.html")) {
        response.writeHead(400).end();
        return;
      }
      const source = await exists(target) && (await stat(target)).isFile() ? target : join(directory, "index.html");
      response.writeHead(200, { "content-type": contentType(source), "cache-control": "no-store" });
      createReadStream(source).pipe(response);
    } catch {
      response.writeHead(500).end();
    }
  });
  await new Promise((resolvePromise) => server.listen(0, "127.0.0.1", resolvePromise));
  const address = server.address();
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

function forbiddenMatches(text) {
  const matches = [];
  for (const word of forbidden) {
    const expression = word.includes(",") ? new RegExp(word, "i") : new RegExp(`\\b${word}\\b`, "i");
    if (expression.test(text)) matches.push(word);
  }
  return matches;
}

async function renderedChecks(baseUrl, failures, { expectRedirects }) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const results = [];
  try {
    for (const route of requiredRoutes) {
      const response = await desktop.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      const text = await desktop.locator("body").innerText();
      results.push({ route, status: response?.status() || 0, text });
      assert((response?.status() || 0) === 200, `Required route did not return HTTP 200: ${route}`, failures);
    }
    const homepage = results.find((entry) => entry.route === "/")?.text || "";
    for (const item of ["KS Active", "Archive Sale", "KALM Move"]) assert(homepage.includes(item), `Required navigation item is missing from rendered homepage: ${item}`, failures);
    const product = results.find((entry) => entry.route.includes("kalm-signature"))?.text || "";
    for (const item of ["KALM Signature Oversized Tee", "R699", "Black", "White"]) assert(product.includes(item), `Required Signature Tee fact is missing from rendered route: ${item}`, failures);
    const forbiddenFound = forbiddenMatches(results.map((entry) => entry.text).join("\n"));
    assert(forbiddenFound.length === 0, `Forbidden customer-facing content rendered: ${forbiddenFound.join(", ")}`, failures);
    assert(!/test\s*(mode|environment)|preview\s*(deployment|mode)/i.test(homepage), "Preview or test banner is rendered.", failures);
    const mobile = await browser.newPage({ viewport: { width: 360, height: 800 } });
    await mobile.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    const menuCount = await mobile.getByRole("button", { name: "Menu" }).count();
    assert(menuCount === 1, "Mobile Menu control is missing or ambiguous.", failures);
    await mobile.close();
    if (expectRedirects) {
      for (const route of ["/ks-active", "/archive-sale", "/kalm-move"]) {
        const result = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
        assert([301, 302, 307, 308].includes(result.status), `Expected redirect was not returned: ${route}`, failures);
      }
    }
    return results.map(({ route, status }) => ({ route, status }));
  } finally {
    await browser.close();
  }
}

async function writeManifest(manifest) {
  await mkdir(resolve(root, "release"), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function validatePreflight() {
  const failures = [];
  const git = await inspectGit(failures);
  await copyCandidate();
  const candidate = await inspectCandidate(failures);
  const server = await startStaticServer(publishDir);
  let routes = [];
  try { routes = await renderedChecks(server.baseUrl, failures, { expectRedirects: true }); }
  finally { await new Promise((resolvePromise) => server.server.close(resolvePromise)); }
  const lockFile = await exists(join(root, "package-lock.json")) ? "package-lock.json" : null;
  const manifest = {
    repositoryRemote: git.remote,
    branch: productionBranch,
    commitSha: git.head,
    treeSha: git.treeSha,
    buildTimestamp: new Date().toISOString(),
    nodeVersion: process.version,
    dependencyLockFile: lockFile,
    dependencyLockFileHash: lockFile ? await hashFile(join(root, lockFile)) : null,
    buildCommand: "node tools/kalm-production-release.mjs --mode preflight",
    publishDirectory: relative(root, publishDir).replaceAll("\\", "/"),
    fileCount: candidate.files.length,
    totalAssetCount: candidate.files.filter((file) => /\.(avif|gif|jpe?g|png|svg|webp|woff2?)$/i.test(file)).length,
    redirectRuleCount: candidate.redirectCount,
    productCount: candidate.products.length,
    variantCount: candidate.variantCount,
    requiredRoutes,
    forbiddenStrings: forbidden,
    criticalAssetHashes: candidate.criticalAssetHashes,
    releaseApprover: args.approver || "pending GitHub production-environment approval",
    previousProductionDeployId: args["previous-deploy"] || "unknown",
    renderedRouteChecks: routes,
    validationStatus: failures.length === 0 ? "pass" : "fail",
    failures
  };
  await writeManifest(manifest);
  if (failures.length) throw new Error(`Release preflight failed:\n- ${failures.join("\n- ")}`);
}

async function validatePostDeploy() {
  const failures = [];
  const baseUrl = String(args["base-url"] || "").replace(/\/$/, "");
  assert(/^https:\/\//.test(baseUrl), "A HTTPS production base URL is required.", failures);
  const retries = Number(args.retry || 1);
  let routes = [];
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const attemptFailures = [];
    try {
      const homepage = await fetch(`${baseUrl}/`, { redirect: "manual" });
      assert(homepage.status === 200, `Production homepage returned HTTP ${homepage.status}.`, attemptFailures);
      const homeHtml = await homepage.text();
      assert(!/sk_(live|test)_|pk_(live|test)_|PAYSTACK_SECRET|secret_key/i.test(homeHtml), "Production HTML exposes a private payment credential marker.", attemptFailures);
      const staticChecks = await Promise.all(["/script.js", "/styles.css", "/products.json", "/script.js.map"].map(async (path) => ({ path, response: await fetch(`${baseUrl}${path}`, { redirect: "manual" }) })));
      for (const item of staticChecks.filter((item) => item.path !== "/script.js.map")) {
        const text = await item.response.text();
        assert(!/sk_(live|test)_|pk_(live|test)_|PAYSTACK_SECRET|secret_key|paystack.*test/i.test(text), `Sensitive or test payment marker found in ${item.path}.`, attemptFailures);
      }
      assert(staticChecks.find((item) => item.path === "/script.js.map").response.status !== 200, "Production source map is publicly available.", attemptFailures);
      routes = await renderedChecks(baseUrl, attemptFailures, { expectRedirects: true });
      const privateReport = await fetch(`${baseUrl}/reports/PRODUCTION-INCIDENT-20260720/RESTORATION.md`, { redirect: "manual" });
      assert(privateReport.status !== 200, "Private report is publicly reachable.", attemptFailures);
      const notFound = await fetch(`${baseUrl}/__kalm-release-404__`, { redirect: "manual" });
      assert(notFound.status === 404 || /not found/i.test(await notFound.text()), "404 behaviour is not available.", attemptFailures);
    } catch (error) { attemptFailures.push(error.message); }
    if (attemptFailures.length === 0) break;
    failures.splice(0, failures.length, ...attemptFailures);
    if (attempt < retries) await new Promise((resolvePromise) => setTimeout(resolvePromise, 5000));
  }
  const result = { baseUrl, checkedAt: new Date().toISOString(), routes, validationStatus: failures.length === 0 ? "pass" : "fail", failures };
  await writeFile(resolve(root, "release/kalm-production-smoke.json"), `${JSON.stringify(result, null, 2)}\n`);
  if (failures.length) throw new Error(`Post-deploy smoke test failed:\n- ${failures.join("\n- ")}`);
}

if (mode === "preflight") await validatePreflight();
else if (mode === "postdeploy") await validatePostDeploy();
else throw new Error(`Unknown mode: ${mode}`);
