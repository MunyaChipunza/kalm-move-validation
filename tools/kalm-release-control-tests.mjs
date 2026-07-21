#!/usr/bin/env node
import { createHash } from "node:crypto";

const productionRemote = "https://github.com/MunyaChipunza/kalm-move-validation";
const expectedNetlifySiteId = "06334c13-7d82-45f1-b983-4a7295de88d8";
const productionDomain = "https://kalmcollective.co.za";
const buildSignature = "KALM_CANONICAL_STOREFRONT_RELEASE_V1";
const fullCommit = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const fullTree = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const forbidden = ["Wellness", "Outdoor", "Home", "Brands", "movement, outdoor routines and everyday living"];

function hashObject(value) {
  return createHash("sha256").update(JSON.stringify(value, Object.keys(value).sort())).digest("hex");
}

function validateCandidate(candidate) {
  const failures = [];
  if (candidate.repository !== productionRemote) failures.push("wrong repository");
  if (candidate.netlifySiteId !== expectedNetlifySiteId) failures.push("wrong Netlify site ID");
  if (!/^[a-f0-9]{40}$/i.test(candidate.sourceCommit || "")) failures.push("invalid source commit");
  if (candidate.checkedOutCommit !== candidate.sourceCommit) failures.push("mismatched source commit");
  if (candidate.files.length === 1 && candidate.files[0] === "index.html") failures.push("one-file replacement website");
  for (const required of ["index.html", "script.js", "styles.css", "products.json", "route-bootstrap.js", "netlify.toml", "assets/logo.png", "branding/kalm-nyati.png", "data/kalm-move-preview-prices.json"]) {
    if (!candidate.files.includes(required)) failures.push(`missing ${required}`);
  }
  const outputText = Object.values(candidate.text || {}).join("\n");
  for (const word of forbidden) {
    const expression = word.includes(",") ? new RegExp(word, "i") : new RegExp(`\\b${word}\\b`, "i");
    if (expression.test(outputText)) failures.push(`forbidden legacy output: ${word}`);
  }
  if (/sk_(?:live|test)_|PAYSTACK_SECRET|secret_key|paystack.*(?:test|live|settlement|webhook|api key)/i.test(outputText)) failures.push("Paystack marker");
  if (/52adadfd-1d6b-4128-9df1-575614f2f1df|kalm-collective-intranet|munya task application/i.test(outputText)) failures.push("Munya task-app marker");
  return failures;
}

function validateLiveSignature(signature, liveAssets, expectedCommit) {
  const failures = [];
  if (signature.repository !== productionRemote) failures.push("signature repository mismatch");
  if (signature.sourceCommitSha !== expectedCommit) failures.push("signature source commit mismatch");
  if (!/^[a-f0-9]{40}$/i.test(signature.sourceTreeSha || "")) failures.push("signature source tree mismatch");
  if (signature.expectedNetlifySiteId !== expectedNetlifySiteId) failures.push("signature site mismatch");
  if (signature.productionDomain !== productionDomain) failures.push("signature domain mismatch");
  if (signature.buildSignature !== buildSignature) failures.push("signature build marker mismatch");
  if (signature.criticalAssetHash !== hashObject(liveAssets)) failures.push("signature critical asset hash mismatch");
  return failures;
}

function safeCandidate() {
  const files = ["index.html", "script.js", "styles.css", "products.json", "route-bootstrap.js", "netlify.toml", "assets/logo.png", "branding/kalm-nyati.png", "data/kalm-move-preview-prices.json"];
  for (let index = 0; index < 55; index += 1) files.push(`assets/product-${index}.webp`);
  return {
    repository: productionRemote,
    netlifySiteId: expectedNetlifySiteId,
    sourceCommit: fullCommit,
    checkedOutCommit: fullCommit,
    files,
    text: {
      "index.html": "KS Active Archive Sale KALM Move KALM Signature Oversized Tee R699 Black White",
      "script.js": "const nav = ['KS Active', 'Archive Sale', 'KALM Move'];",
      "products.json": "{\"slug\":\"kalm-signature-oversized-tee\",\"title\":\"KALM Signature Oversized Tee\"}",
      "netlify.toml": "[[redirects]]"
    }
  };
}

function expectPass(name, failures) {
  if (failures.length) throw new Error(`${name} expected pass but failed: ${failures.join(", ")}`);
}

function expectFail(name, failures, expected) {
  if (!failures.some((failure) => failure.includes(expected))) throw new Error(`${name} expected failure containing "${expected}" but got: ${failures.join(", ")}`);
}

const safe = safeCandidate();
expectPass("safe complete storefront fixture", validateCandidate(safe));
expectFail("one-file index build", validateCandidate({ ...safe, files: ["index.html"] }), "one-file");
expectFail("wrong repository", validateCandidate({ ...safe, repository: "https://github.com/Other/repo" }), "wrong repository");
expectFail("wrong Netlify site ID", validateCandidate({ ...safe, netlifySiteId: "00000000-0000-0000-0000-000000000000" }), "wrong Netlify site ID");
expectFail("forbidden legacy storefront output", validateCandidate({ ...safe, text: { ...safe.text, "script.js": "Outdoor Wellness Home Brands" } }), "forbidden legacy output");
expectFail("Paystack marker", validateCandidate({ ...safe, text: { ...safe.text, "script.js": "PAYSTACK_SECRET=sk_test_bad" } }), "Paystack marker");
expectFail("Munya task app marker", validateCandidate({ ...safe, text: { ...safe.text, "script.js": "kalm-collective-intranet 52adadfd-1d6b-4128-9df1-575614f2f1df" } }), "Munya task-app marker");
expectFail("mismatched source commit", validateCandidate({ ...safe, checkedOutCommit: "cccccccccccccccccccccccccccccccccccccccc" }), "mismatched source commit");

const liveAssets = { "index.html": "one", "script.js": "two", "styles.css": "three", "products.json": "four" };
expectPass("matching deployed provenance", validateLiveSignature({
  repository: productionRemote,
  sourceCommitSha: fullCommit,
  sourceTreeSha: fullTree,
  expectedNetlifySiteId,
  productionDomain,
  buildSignature,
  criticalAssetHash: hashObject(liveAssets)
}, liveAssets, fullCommit));
expectFail("mismatched deployed provenance file", validateLiveSignature({
  repository: productionRemote,
  sourceCommitSha: "cccccccccccccccccccccccccccccccccccccccc",
  sourceTreeSha: fullTree,
  expectedNetlifySiteId,
  productionDomain,
  buildSignature,
  criticalAssetHash: hashObject(liveAssets)
}, liveAssets, fullCommit), "source commit");

console.log(JSON.stringify({ validationStatus: "pass", tests: 10 }, null, 2));
