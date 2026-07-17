import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const text = [
  "netlify.toml",
  "script.js",
  "index.html",
  "netlify/functions/paystack-config.mjs",
  "netlify/functions/paystack-initialize.mjs",
  "netlify/functions/paystack-verify.mjs",
  "netlify/functions/paystack-webhook.mjs",
  "netlify/functions/_shared/paystack-core.mjs",
  "netlify/functions/_shared/order-store.mjs"
].filter(exists).map(read).join("\n");

const checks = [
  ["functions directory configured", /\[functions\][\s\S]*directory = "netlify\/functions"/.test(read("netlify.toml"))],
  ["static publish output is separated from function source", /publish = "dist"/.test(read("netlify.toml")) && exists("tools/build-netlify-static.mjs")],
  ["static build excludes Git metadata", !exists("dist/.git")],
  ["initialise endpoint exists", text.includes("/api/payments/paystack/initialize")],
  ["verify endpoint exists", text.includes("/api/payments/paystack/verify")],
  ["webhook endpoint exists", text.includes("/api/payments/paystack/webhook")],
  ["server-side Paystack initialise call exists", text.includes("/transaction/initialize")],
  ["server-side Paystack verify call exists", text.includes("/transaction/verify/")],
  ["HMAC SHA512 webhook verification exists", text.includes('createHmac("sha512"')],
  ["test-only inventory action exists", text.includes("test_ledger_only_no_real_inventory_change")],
  ["public reports are blocked", read("netlify.toml").includes("/reports/PAYSTACK/*")],
  ["payment result route exists", read("script.js").includes("renderPaymentResult")],
  ["test-mode banner exists", read("script.js").includes("PAYSTACK TEST MODE")],
  ["no secret key literal is present", !/sk_(?:test|live)_[A-Za-z0-9_-]{8,}/.test(text)],
  ["no server secret is sent to the browser", !/activeSecretKey[^\n]{0,100}authorizationUrl/.test(read("script.js"))]
].map(([name, passed]) => ({ name, passed }));

const result = { passed: checks.every((item) => item.passed), checkCount: checks.length, checks };
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
