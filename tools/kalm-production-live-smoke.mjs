#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const baseUrl = String(args["base-url"] || "").replace(/\/$/, "");
const approvedCommit = String(args.commit || "");
const retries = Math.max(1, Number(args.retry || 1));
const productionDomain = "https://kalmcollective.co.za";
const productionRemote = "https://github.com/MunyaChipunza/kalm-move-validation";
const expectedNetlifySiteId = "06334c13-7d82-45f1-b983-4a7295de88d8";
const requiredRoutes = ["/", "/ks-active", "/archive-sale", "/kalm-move", "/products/kalm-signature-oversized-tee", "/terms.html"];
const futureCategoryRoutes = ["/shop?category=home", "/shop?category=wellness", "/shop?category=outdoor"];

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    parsed[name] = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
  }
  return parsed;
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
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

async function curlRequest(url, { follow = true } = {}) {
  const marker = "\n__KALM_HTTP_STATUS__:";
  const parameters = [
    "--silent",
    "--show-error",
    "--connect-timeout", "10",
    "--max-time", "30",
    "--retry", "3",
    "--retry-delay", "1",
    "--retry-all-errors"
  ];
  if (follow) parameters.push("--location");
  parameters.push("--write-out", `${marker}%{http_code}`, url);

  try {
    const { stdout } = await execFile("curl", parameters, {
      cwd: root,
      windowsHide: true,
      maxBuffer: 50 * 1024 * 1024
    });
    const markerIndex = stdout.lastIndexOf(marker);
    if (markerIndex < 0) throw new Error("curl response did not include an HTTP status marker");
    const body = stdout.slice(0, markerIndex);
    const status = Number(stdout.slice(markerIndex + marker.length).trim());
    if (!Number.isFinite(status) || status <= 0) throw new Error(`curl returned invalid HTTP status for ${url}`);
    return { url, status, body };
  } catch (error) {
    const stderr = String(error?.stderr || "").trim();
    const detail = stderr || error?.message || "unknown curl error";
    throw new Error(`curl request failed for ${url}: ${detail}`);
  }
}

async function renderedChecks(failures) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const results = [];

  try {
    for (const route of requiredRoutes) {
      const response = await desktop.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 30000 });
      const text = await desktop.locator("body").innerText();
      const addToBagCount = await desktop.locator("[data-add-to-bag]").count();
      results.push({ route, status: response?.status() || 0, text, addToBagCount });
      assert((response?.status() || 0) === 200, `Required route did not return HTTP 200: ${route}`, failures);
    }

    const homepage = results.find((entry) => entry.route === "/")?.text || "";
    for (const item of ["KS Active", "Archive Sale", "KALM Move"]) {
      assert(homepage.includes(item), `Required navigation item is missing from rendered homepage: ${item}`, failures);
    }

    const movePreview = results.find((entry) => entry.route === "/kalm-move");
    assert((movePreview?.addToBagCount || 0) === 0, "KALM Move preview exposes an add-to-bag control.", failures);

    const signatureTee = results.find((entry) => entry.route.includes("kalm-signature"));
    const signatureText = signatureTee?.text || "";
    for (const item of ["KALM Signature Oversized Tee", "R699", "Black", "White"]) {
      assert(signatureText.includes(item), `Required Signature Tee fact is missing from rendered route: ${item}`, failures);
    }

    for (const route of futureCategoryRoutes) {
      const response = await desktop.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 30000 });
      const addToBagCount = await desktop.locator("[data-add-to-bag]").count();
      assert((response?.status() || 0) === 200, `Future-category route did not return HTTP 200: ${route}`, failures);
      assert(addToBagCount === 0, `Unapproved future category exposes an add-to-bag control: ${route}`, failures);
    }

    const terms = results.find((entry) => entry.route === "/terms.html")?.text || "";
    const termsNormalised = terms.toLocaleLowerCase("en-ZA");
    for (const item of ["Terms & Conditions", "Delivery", "Order cancellation", "Returns", "Refunds", "KALM Collective (Pty) Ltd"]) {
      assert(termsNormalised.includes(item.toLocaleLowerCase("en-ZA")), `Required customer-terms content is missing from /terms.html: ${item}`, failures);
    }

    assert(!/test\s*(mode|environment)|preview\s*deployment/i.test(homepage), "Test or preview deployment banner is rendered.", failures);

    const mobile = await browser.newPage({ viewport: { width: 360, height: 800 } });
    await mobile.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 30000 });
    const menuCount = await mobile.getByRole("button", { name: "Menu" }).count();
    assert(menuCount === 1, "Mobile Menu control is missing or ambiguous.", failures);
    await mobile.close();

    return results.map(({ route, status, addToBagCount }) => ({ route, status, addToBagCount }));
  } finally {
    await browser.close();
  }
}

async function runAttempt(attempt) {
  const failures = [];
  console.log(`KALM live smoke attempt ${attempt}/${retries}`);

  assert(baseUrl === productionDomain, "Live smoke must target the canonical production domain.", failures);
  assert(/^[a-f0-9]{40}$/i.test(approvedCommit), "A full approved source commit SHA is required.", failures);

  const homepage = await curlRequest(`${baseUrl}/`);
  assert(homepage.status === 200, `Production homepage returned HTTP ${homepage.status}.`, failures);
  assert(!/sk_(live|test)_|pk_(live|test)_|PAYSTACK_SECRET|secret_key/i.test(homepage.body), "Production HTML exposes a private payment credential marker.", failures);

  const staticPaths = ["/script.js", "/styles.css", "/products.json"];
  const staticResponses = {};
  for (const path of staticPaths) {
    const response = await curlRequest(`${baseUrl}${path}`);
    staticResponses[path] = response;
    assert(response.status === 200, `Production static asset returned HTTP ${response.status}: ${path}`, failures);
    assert(!/sk_(live|test)_|pk_(live|test)_|PAYSTACK_SECRET|secret_key|paystack.*test/i.test(response.body), `Sensitive or test payment marker found in ${path}.`, failures);
  }

  const sourceMap = await curlRequest(`${baseUrl}/script.js.map`, { follow: false });
  assert(sourceMap.status !== 200, "Production source map is publicly available.", failures);

  const routes = await renderedChecks(failures);

  for (const route of ["/ks-active", "/archive-sale", "/kalm-move"]) {
    const response = await curlRequest(`${baseUrl}${route}`, { follow: false });
    assert([301, 302, 307, 308].includes(response.status), `Expected redirect was not returned: ${route} (HTTP ${response.status})`, failures);
  }

  const signatureResponse = await curlRequest(`${baseUrl}/.kalm-build-signature.json`);
  assert(signatureResponse.status === 200, "Production build signature is not publicly verifiable.", failures);
  if (signatureResponse.status === 200) {
    let signature = null;
    try { signature = JSON.parse(signatureResponse.body); }
    catch { failures.push("Production build signature is not valid JSON."); }
    if (signature) {
      assert(signature.repository === productionRemote, "Production signature repository does not match the canonical repository.", failures);
      assert(signature.sourceCommitSha === approvedCommit, "Production signature source commit does not match the approved source commit.", failures);
      assert(/^[a-f0-9]{40}$/i.test(signature.sourceTreeSha || ""), "Production signature source tree SHA is missing or invalid.", failures);
      assert(signature.expectedNetlifySiteId === expectedNetlifySiteId, "Production signature Netlify site ID does not match.", failures);
      assert(signature.productionDomain === productionDomain, "Production signature domain does not match.", failures);
      assert(signature.buildSignature === "KALM_CANONICAL_STOREFRONT_RELEASE_V1", "Production signature build signature does not match.", failures);
      assert(/^[a-f0-9]{64}$/i.test(signature.criticalAssetHash || ""), "Production signature critical asset hash is missing or invalid.", failures);

      const liveCriticalAssetHashes = {
        "index.html": hashBuffer(Buffer.from(homepage.body, "utf8")),
        "script.js": hashBuffer(Buffer.from(staticResponses["/script.js"].body, "utf8")),
        "styles.css": hashBuffer(Buffer.from(staticResponses["/styles.css"].body, "utf8")),
        "products.json": hashBuffer(Buffer.from(staticResponses["/products.json"].body, "utf8"))
      };
      assert(hashObject(liveCriticalAssetHashes) === signature.criticalAssetHash, "Production critical asset hash does not match the live files.", failures);
    }
  }

  const privateReport = await curlRequest(`${baseUrl}/reports/PRODUCTION-INCIDENT-20260720/RESTORATION.md`, { follow: false });
  assert(privateReport.status !== 200, "Private report is publicly reachable.", failures);

  const notFound = await curlRequest(`${baseUrl}/__kalm-release-404__`, { follow: false });
  assert(notFound.status === 404 || /not found/i.test(notFound.body), "404 behaviour is not available.", failures);

  return {
    baseUrl,
    approvedCommit,
    checkedAt: new Date().toISOString(),
    attempt,
    routes,
    validationStatus: failures.length === 0 ? "pass" : "fail",
    failures
  };
}

if (baseUrl !== productionDomain) throw new Error("A canonical HTTPS production base URL is required.");

let finalResult = null;
for (let attempt = 1; attempt <= retries; attempt += 1) {
  try {
    finalResult = await runAttempt(attempt);
    if (finalResult.failures.length === 0) break;
  } catch (error) {
    finalResult = {
      baseUrl,
      approvedCommit,
      checkedAt: new Date().toISOString(),
      attempt,
      routes: [],
      validationStatus: "fail",
      failures: [error.message]
    };
  }
  if (attempt < retries) await sleep(5000);
}

await mkdir(resolve(root, "release"), { recursive: true });
await writeFile(resolve(root, "release/kalm-production-smoke.json"), `${JSON.stringify(finalResult, null, 2)}\n`);

if (!finalResult || finalResult.validationStatus !== "pass") {
  throw new Error(`Live production smoke failed:\n- ${(finalResult?.failures || ["unknown failure"]).join("\n- ")}`);
}

console.log("KALM live production smoke passed.");
