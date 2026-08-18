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
const requiredRoutes = ["/", "/ks-active", "/archive-sale", "/kalm-move", "/products/kalm-signature-oversized-tee", "/terms.html", "/payment-return.html"];
const futureCategoryRoutes = ["/shop?category=home", "/shop?category=wellness", "/shop?category=outdoor"];
const forbidden = [];
const productionRemote = "https://github.com/MunyaChipunza/kalm-move-validation";
const expectedNetlifySiteId = "06334c13-7d82-45f1-b983-4a7295de88d8";
const expectedNetlifySiteName = "kalm-collective-storefront";
// Netlify post-processes detected form markup in index.html. Keep the HTML
// route under rendered validation, while provenance hashes only static files
// whose published bytes are preserved exactly by the CDN.
const provenanceStaticAssets = ["script.js", "styles.css", "products.json"];
const productionDomain = "https://kalmcollective.co.za";
const sentinelPath = resolve(root, ".kalm-approved-release-root");
const allowNonProductionBranch = Boolean(args["allow-non-production-branch"]);

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

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashObject(value) {
  return hashBuffer(Buffer.from(stableJson(value), "utf8"));
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

async function listTextFiles(directory) {
  // Scan executable or publishable runtime material. Documentation, tests and
  // release-control tools intentionally contain hostile-secret test markers
  // and task-application names; treating those as public runtime would make
  // the safety check both noisy and less trustworthy.
  const ignored = new Set([".git", "node_modules", ".release-output", "release", "reports", "docs", "review", "tools", "scripts", "tests"]);
  const textExtensions = new Set([".html", ".js", ".mjs", ".css", ".json", ".xml", ".txt", ".toml", ".webmanifest", ".yml", ".yaml"]);
  const files = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const full = join(current, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.isFile() && textExtensions.has(extname(entry.name).toLowerCase())) files.push(full);
    }
  }
  await visit(directory);
  return files;
}

async function copyCandidate() {
  await rm(publishDir, { recursive: true, force: true });
  await mkdir(publishDir, { recursive: true });
  const allowedDirectories = ["assets", "branding", "data"];
  const allowedRootFiles = new Set([
    "404.html",
    "index.html",
    "payment-return.html",
    "thanks.html",
    "merchandising.js",
    "route-bootstrap.js",
    "script.js",
    "styles.css",
    "products.json",
    "netlify.toml",
    "robots.txt",
    "sitemap.xml",
    "site.webmanifest",
    "llms.txt"
  ]);
  for (const name of allowedDirectories) {
    const source = join(root, name);
    if (await exists(source)) await cp(source, join(publishDir, name), { recursive: true });
  }
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isFile() || !allowedRootFiles.has(entry.name)) continue;
    await copyFile(join(root, entry.name), join(publishDir, entry.name));
  }
}

async function inspectReleaseSentinel(failures) {
  let sentinel = null;
  try { sentinel = JSON.parse(await readFile(sentinelPath, "utf8")); }
  catch {
    failures.push("The canonical .kalm-approved-release-root sentinel is missing or invalid JSON.");
    return null;
  }
  assert(sentinel.repositoryRemote === productionRemote, "Release sentinel has an unexpected canonical remote.", failures);
  assert(sentinel.netlifySiteId === expectedNetlifySiteId, "Release sentinel has an unexpected Netlify site ID.", failures);
  assert(sentinel.netlifySiteName === expectedNetlifySiteName, "Release sentinel has an unexpected Netlify site name.", failures);
  assert(sentinel.productionDomain === productionDomain, "Release sentinel has an unexpected production domain.", failures);
  assert(sentinel.productionBranch === "master", "Release sentinel does not preserve master as the approved production branch.", failures);
  if (!allowNonProductionBranch) assert(sentinel.productionBranch === productionBranch, "Release sentinel does not match the approved branch.", failures);
  assert(sentinel.publishDirectory === ".release-output/kalm-production", "Release sentinel has an unexpected publish directory.", failures);
  assert(sentinel.buildCommand === "node tools/kalm-production-release.mjs --mode preflight", "Release sentinel has an unexpected build command.", failures);
  assert(sentinel.expectedBuildSignature === "KALM_CANONICAL_STOREFRONT_RELEASE_V1", "Release sentinel has an unexpected build signature.", failures);
  assert(resolve(root, sentinel.publishDirectory || "") === publishDir, "Publish directory does not match the canonical sentinel.", failures);
  const relativePublishDirectory = relative(root, publishDir);
  assert(relativePublishDirectory.length > 0 && !relativePublishDirectory.startsWith("..") && !relativePublishDirectory.includes(":\\"), "Publish directory is not a child of the canonical repository.", failures);
  return sentinel;
}

async function writeBuildSignature(signature) {
  // Netlify does not serve dotfiles from a published directory. This marker is
  // intentionally public so the protected post-deploy smoke test can prove the
  // live files came from the approved source commit. It contains provenance and
  // integrity hashes only; no credentials or customer data.
  await writeFile(join(publishDir, "kalm-build-signature.json"), JSON.stringify(signature, null, 2) + "\n");
}

async function runForbiddenScanner(directory, label, failures) {
  try {
    const { stdout } = await execFile(process.execPath, [join(root, "scripts", "check-forbidden-legacy-storefront.mjs"), "--root", directory], { cwd: root, windowsHide: true });
    return JSON.parse(stdout);
  } catch (error) {
    const result = String(error.stdout || error.message || "scanner failed").trim();
    failures.push(label + " legacy-content sentinel failed: " + result);
    return { status: "fail", detail: result };
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
  const originBranch = allowNonProductionBranch ? null : await shell("git", ["rev-parse", `origin/${productionBranch}`]);
  const treeSha = await shell("git", ["rev-parse", `${head}^{tree}`]);
  assert(status.length === 0, "Working tree is dirty.", failures);
  assert(remote === productionRemote, `Unexpected repository remote: ${remote}`, failures);
  assert(/^[a-f0-9]{40}$/i.test(expectedCommit), "A full 40-character source commit SHA is required.", failures);
  assert(head === expectedCommit, "Checked-out commit does not match the approved source commit.", failures);
  if (!allowNonProductionBranch) assert(originBranch === expectedCommit, `Approved source commit is not the current ${productionBranch} head.`, failures);
  else assert(productionBranch !== "master", "Non-production validation must not claim to be the master release branch.", failures);
  return { head, treeSha, remote, status: status.length === 0 ? "clean" : "dirty" };
}

function redirectAssertions(toml, failures) {
  const redirectCount = (toml.match(/^\[\[redirects\]\]$/gm) || []).length;
  assert(redirectCount >= 12, "Redirect-rule count is implausibly low.", failures);
  for (const expected of ["/products/*", "/collections/*", "/ks-active", "/archive-sale", "/kalm-move", "/terms.html"]) {
    assert(toml.includes(`from = \"${expected}\"`), `Expected redirect rule is missing: ${expected}`, failures);
  }
  return redirectCount;
}

async function sourceSeparationAssertions(directory, failures) {
  const files = await listTextFiles(directory);
  const findings = [];
  const paymentPattern = /sk_(?:live|test)_|PAYSTACK_SECRET|secret_key|paystack.*(?:test|live|settlement|webhook|api key)/i;
  const taskAppPattern = /52adadfd-1d6b-4128-9df1-575614f2f1df|kalm-collective-intranet|munya task application/i;
  for (const file of files) {
    const text = await readFile(file, "utf8");
    const relativeFile = relative(directory, file).replaceAll("\\", "/");
    if (paymentPattern.test(text)) findings.push(`Paystack/test-payment marker in ${relativeFile}`);
    if (taskAppPattern.test(text)) findings.push(`Munya task application marker in ${relativeFile}`);
  }
  assert(findings.length === 0, findings.join("; "), failures);
  return { scannedTextFileCount: files.length, status: findings.length === 0 ? "pass" : "fail", findings };
}

async function inspectCandidate(failures, sentinel) {
  const sourceTomlPath = join(root, "netlify.toml");
  const sourceToml = await exists(sourceTomlPath) ? await readFile(sourceTomlPath, "utf8") : "";
  assert(sourceToml.length > 0, "netlify.toml is missing.", failures);
  const redirectCount = redirectAssertions(sourceToml, failures);
  const mustExist = ["index.html", "payment-return.html", "script.js", "styles.css", "products.json", "route-bootstrap.js", "netlify.toml", "assets", "branding", "data/legal/terms.html"];
  for (const item of mustExist) assert(await exists(join(publishDir, item)), `Expected build asset is missing: ${item}`, failures);
  const files = await listFiles(publishDir);
  assert(files.length >= 50, `Candidate has an implausibly small file count (${files.length}).`, failures);
  assert(!(files.length === 1 && relative(publishDir, files[0]) === "index.html"), "Candidate contains only index.html.", failures);
  assert(!files.some((file) => relative(publishDir, file).startsWith("reports")), "Private reports are present in the publish directory.", failures);
  assert(!files.some((file) => file.endsWith(".map")), "Source maps are present in the publish directory.", failures);
  const functionDirectories = [];
  for (const item of ["netlify/functions", "functions"]) {
    if (await exists(join(root, item))) functionDirectories.push(item);
  }
  const functionsStatus = functionDirectories.length ? "configured" : "none-configured";
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
  for (const asset of provenanceStaticAssets) {
    const path = join(publishDir, asset);
    if (await exists(path)) criticalAssetHashes[asset] = await hashFile(path);
  }
  return { files, products, variantCount, redirectCount, criticalAssetHashes, functionsStatus };
}

function contentType(path) {
  return ({ ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon" })[extname(path).toLowerCase()] || "application/octet-stream";
}

async function startStaticServer(directory) {
  const shortRouteRedirects = { "/ks-active": "/collections/ks-active", "/archive-sale": "/collections/sale", "/kalm-move": "/brand/kalm-move" };
  const internalRewrites = { "/terms.html": "/data/legal/terms.html" };
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://localhost");
      if (shortRouteRedirects[url.pathname]) {
        response.writeHead(302, { location: shortRouteRedirects[url.pathname] });
        response.end();
        return;
      }
      const rewrittenPath = internalRewrites[url.pathname] || url.pathname;
      const requested = decodeURIComponent(rewrittenPath === "/" ? "/index.html" : rewrittenPath);
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
      const addToBagCount = await desktop.locator("[data-add-to-bag]").count();
      results.push({ route, status: response?.status() || 0, text, addToBagCount });
      assert((response?.status() || 0) === 200, `Required route did not return HTTP 200: ${route}`, failures);
    }
    const homepage = results.find((entry) => entry.route === "/")?.text || "";
    for (const item of ["KS Active", "Archive Sale", "KALM Move"]) assert(homepage.includes(item), `Required navigation item is missing from rendered homepage: ${item}`, failures);

    const movePreview = results.find((entry) => entry.route === "/kalm-move");
    assert((movePreview?.addToBagCount || 0) === 0, "KALM Move preview exposes an add-to-bag control.", failures);

    const product = results.find((entry) => entry.route.includes("kalm-signature"));
    const productText = product?.text || "";
    for (const item of ["KALM Signature Oversized Tee", "R699", "Black", "White"]) assert(productText.includes(item), `Required Signature Tee fact is missing from rendered route: ${item}`, failures);

    for (const route of futureCategoryRoutes) {
      const response = await desktop.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      const addToBagCount = await desktop.locator("[data-add-to-bag]").count();
      assert((response?.status() || 0) === 200, `Future-category preview route did not return HTTP 200: ${route}`, failures);
      assert(addToBagCount === 0, `Unapproved future category exposes an add-to-bag control: ${route}`, failures);
    }

    const terms = results.find((entry) => entry.route === "/terms.html")?.text || "";
    const termsNormalised = terms.toLocaleLowerCase("en-ZA");
    for (const item of ["Terms & Conditions", "Delivery", "Order cancellation", "Returns", "Refunds", "KALM Collective (Pty) Ltd", "support@kalmcollective.co.za"]) {
      assert(termsNormalised.includes(item.toLocaleLowerCase("en-ZA")), `Required customer-terms content is missing from /terms.html: ${item}`, failures);
    }

    const forbiddenFound = forbiddenMatches(results.map((entry) => entry.text).join("\n"));
    assert(forbiddenFound.length === 0, `Forbidden customer-facing content rendered: ${forbiddenFound.join(", ")}`, failures);
    assert(!/test\s*(mode|environment)|preview\s*deployment/i.test(homepage), "Test or preview deployment banner is rendered.", failures);
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
    return results.map(({ route, status, addToBagCount }) => ({ route, status, addToBagCount }));
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
  const sentinel = await inspectReleaseSentinel(failures);
  const git = await inspectGit(failures);
  const sourceLegacyScan = await runForbiddenScanner(root, "Source", failures);
  const sourceSeparationScan = await sourceSeparationAssertions(root, failures);
  await copyCandidate();
  const candidate = await inspectCandidate(failures, sentinel);
  const outputLegacyScan = await runForbiddenScanner(publishDir, "Generated output", failures);
  const outputSeparationScan = await sourceSeparationAssertions(publishDir, failures);
  const server = await startStaticServer(publishDir);
  let routes = [];
  try { routes = await renderedChecks(server.baseUrl, failures, { expectRedirects: true }); }
  finally { await new Promise((resolvePromise) => server.server.close(resolvePromise)); }
  const lockFile = await exists(join(root, "package-lock.json")) ? "package-lock.json" : null;
  const criticalAssetHash = hashObject(candidate.criticalAssetHashes);
  const manifest = {
    repositoryRemote: git.remote,
    netlifySiteId: expectedNetlifySiteId,
    netlifySiteName: expectedNetlifySiteName,
    productionDomain,
    branch: productionBranch,
    commitSha: git.head,
    treeSha: git.treeSha,
    buildTimestamp: new Date().toISOString(),
    nodeVersion: process.version,
    dependencyLockFile: lockFile,
    dependencyLockFileHash: lockFile ? await hashFile(join(root, lockFile)) : null,
    buildCommand: "node tools/kalm-production-release.mjs --mode preflight",
    buildSignature: sentinel?.expectedBuildSignature || "missing",
    publishDirectory: relative(root, publishDir).replaceAll("\\", "/"),
    fileCount: candidate.files.length,
    totalAssetCount: candidate.files.filter((file) => /\.(avif|gif|jpe?g|png|svg|webp|woff2?)$/i.test(file)).length,
    functionsStatus: candidate.functionsStatus,
    redirectRuleCount: candidate.redirectCount,
    productCount: candidate.products.length,
    variantCount: candidate.variantCount,
    requiredRoutes,
    futureCategoryRoutes,
    forbiddenStrings: forbidden,
    legacyContentScan: { source: sourceLegacyScan, generatedOutput: outputLegacyScan },
    sourceSeparationScan: { source: sourceSeparationScan, generatedOutput: outputSeparationScan },
    criticalAssetHashes: candidate.criticalAssetHashes,
    criticalAssetHash,
    approvalEvent: args["approval-event"] || (allowNonProductionBranch ? "non-production validation" : "protected Git release event"),
    previousProductionDeployId: args["previous-deploy"] || "unknown",
    renderedRouteChecks: routes,
    validationStatus: failures.length === 0 ? "pass" : "fail",
    failures
  };
  const signature = {
    repository: git.remote,
    sourceCommitSha: git.head,
    sourceTreeSha: git.treeSha,
    expectedNetlifySiteId,
    productionDomain,
    buildSignature: sentinel?.expectedBuildSignature || "missing",
    criticalAssetHash,
    manifestHash: hashObject({ repositoryRemote: git.remote, commitSha: git.head, treeSha: git.treeSha, criticalAssetHashes: candidate.criticalAssetHashes, requiredRoutes }),
    githubRunId: process.env.GITHUB_RUN_ID || null
  };
  await writeBuildSignature(signature);
  await writeManifest(manifest);
  if (failures.length) throw new Error(`Release preflight failed:\n- ${failures.join("\n- ")}`);
}

async function validatePostDeploy() {
  const failures = [];
  const baseUrl = String(args["base-url"] || "").replace(/\/$/, "");
  assert(/^https:\/\//.test(baseUrl), "A HTTPS production base URL is required.", failures);
  assert(baseUrl === productionDomain, "Post-deploy validation must target the canonical production domain.", failures);
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
      if (args.commit) {
        const signature = await fetch(`${baseUrl}/kalm-build-signature.json`, { redirect: "manual" });
        assert(signature.status === 200, "Production build signature is not publicly verifiable.", attemptFailures);
        if (signature.status === 200) {
          const parsed = await signature.json();
          assert(parsed.repository === productionRemote, "Production signature repository does not match the canonical repository.", attemptFailures);
          assert(parsed.sourceCommitSha === args.commit, "Production signature source commit does not match the approved source commit.", attemptFailures);
          assert(/^[a-f0-9]{40}$/i.test(parsed.sourceTreeSha || ""), "Production signature source tree SHA is missing or invalid.", attemptFailures);
          assert(parsed.expectedNetlifySiteId === expectedNetlifySiteId, "Production signature Netlify site ID does not match.", attemptFailures);
          assert(parsed.productionDomain === productionDomain, "Production signature domain does not match.", attemptFailures);
          assert(parsed.buildSignature === "KALM_CANONICAL_STOREFRONT_RELEASE_V1", "Production signature build signature does not match.", attemptFailures);
          assert(/^[a-f0-9]{64}$/i.test(parsed.criticalAssetHash || ""), "Production signature critical asset hash is missing or invalid.", attemptFailures);
          const liveCriticalAssetHashes = {};
          for (const path of provenanceStaticAssets.map((asset) => `/${asset}`)) {
            const asset = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
            assert(asset.status === 200, `Production critical asset is missing: ${path}`, attemptFailures);
            if (asset.status === 200) liveCriticalAssetHashes[path.slice(1)] = hashBuffer(Buffer.from(await asset.arrayBuffer()));
          }
          assert(hashObject(liveCriticalAssetHashes) === parsed.criticalAssetHash, "Production critical asset hash does not match the live files.", attemptFailures);
        }
      }
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

async function verifyControls() {
  const failures = [];
  const workflow = await readFile(resolve(root, ".github/workflows/kalm-production-release.yml"), "utf8");
  const rollbackWorkflow = await readFile(resolve(root, ".github/workflows/kalm-production-rollback.yml"), "utf8");
  const prWorkflow = await readFile(resolve(root, ".github/workflows/kalm-pr-release-control-validation.yml"), "utf8");
  const sentinel = await inspectReleaseSentinel(failures);
  assert(/push:\s*\n\s*branches:\s*\n\s*-\s*master/.test(workflow), "Release workflow does not automatically trigger on master pushes.", failures);
  for (const expected of ["assets/**", "branding/**", "data/**", "404.html", "index.html", "payment-return.html", "thanks.html", "merchandising.js", "route-bootstrap.js", "script.js", "styles.css", "products.json", "netlify.toml", "robots.txt", "sitemap.xml", "site.webmanifest", "llms.txt", "package.json", "package-lock.json", "netlify/**", ".github/workflows/kalm-production-release.yml"]) {
    assert(workflow.includes(`- "${expected}"`), `Release workflow production path filter is missing: ${expected}`, failures);
  }
  for (const prohibited of ["tools/", "scripts/", "*.md"]) assert(!workflow.includes(`- "${prohibited}`), `Release workflow production path filter includes release-control or documentation input: ${prohibited}`, failures);
  assert(!workflow.includes('- ".github/**"'), "Release workflow production path filter includes unrestricted workflow inputs.", failures);
  assert(workflow.includes("workflow_dispatch:"), "Release workflow does not support explicit release dispatch.", failures);
  assert(workflow.includes("environment:\n      name: production"), "Release workflow does not use the production environment for scoped credentials.", failures);
  assert(workflow.includes("EXPECTED_NETLIFY_SITE_ID: 06334c13-7d82-45f1-b983-4a7295de88d8"), "Release workflow does not pin the exact storefront Netlify site ID.", failures);
  assert(workflow.includes("concurrency:\n  group: kalm-production-release"), "Release workflow does not use production release concurrency controls.", failures);
  assert(workflow.includes("restoreSiteDeploy"), "Release workflow does not contain automatic rollback after failed smoke tests.", failures);
  assert(!/production-environment approval/.test(workflow), "Release workflow still describes a second GitHub environment approval.", failures);
  assert(rollbackWorkflow.includes("restoreSiteDeploy"), "Emergency rollback workflow is missing Netlify restoreSiteDeploy.", failures);
  assert(rollbackWorkflow.includes("getSiteDeploy"), "Emergency rollback workflow does not verify the selected deploy before restoring.", failures);
  assert(rollbackWorkflow.includes("6a58f4cdabe29c0e28697f09"), "Emergency rollback workflow does not preserve the known-good deploy default.", failures);
  assert(prWorkflow.includes("pull_request:"), "PR validation workflow does not run on pull requests.", failures);
  assert(prWorkflow.includes("npm ci"), "PR validation workflow does not install pinned dependencies.", failures);
  assert(prWorkflow.includes("release:validate-workflows"), "PR validation workflow does not validate workflow YAML.", failures);
  assert(prWorkflow.includes("release:test-controls"), "PR validation workflow does not run deterministic release-control tests.", failures);
  assert(!prWorkflow.includes("environment:"), "PR validation workflow accesses a GitHub environment.", failures);
  assert(!prWorkflow.includes("NETLIFY_AUTH_TOKEN"), "PR validation workflow references production Netlify secrets.", failures);
  assert(!prWorkflow.includes("netlify deploy --prod"), "PR validation workflow can deploy production.", failures);
  assert(!prWorkflow.includes("restoreSiteDeploy"), "PR validation workflow can restore production deploys.", failures);
  assert(sentinel?.knownGoodBaselineCommit === "91511c00c080dd7b6148df950191af525316a297", "Known-good baseline commit is not recorded.", failures);
  const result = { checkedAt: new Date().toISOString(), validationStatus: failures.length === 0 ? "pass" : "fail", failures };
  await mkdir(resolve(root, "release"), { recursive: true });
  await writeFile(resolve(root, "release/kalm-release-controls.json"), `${JSON.stringify(result, null, 2)}\n`);
  if (failures.length) throw new Error(`Release control verification failed:\n- ${failures.join("\n- ")}`);
}

if (mode === "preflight") await validatePreflight();
else if (mode === "postdeploy") await validatePostDeploy();
else if (mode === "verify-controls") await verifyControls();
else throw new Error(`Unknown mode: ${mode}`);
