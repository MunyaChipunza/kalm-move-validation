#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import process from "node:process";

const expectedSiteId = "06334c13-7d82-45f1-b983-4a7295de88d8";
const expectedBranch = "master";
const productionUrl = "https://kalmcollective.co.za";
const required = ["PAYFAST_MERCHANT_ID", "PAYFAST_MERCHANT_KEY", "PAYFAST_PASSPHRASE", "PAYFAST_RETURN_URL", "PAYFAST_CANCEL_URL", "PAYFAST_NOTIFY_URL"];

function command(file, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { stdio: "inherit", shell: process.platform === "win32" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${file} failed with ${code}`)));
  });
}

async function fail(message) {
  console.error(`PAYFAST ACTIVATION BLOCKED: ${message}`);
  process.exitCode = 1;
}

async function main() {
  if (process.env.PAYFAST_ACTIVATION_TEST !== "1") return fail("Set PAYFAST_ACTIVATION_TEST=1 only after the controlled approval-day checklist is complete.");
  if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_SITE_ID !== expectedSiteId) return fail("This terminal is not targeting the approved storefront site.");
  if (process.env.GITHUB_REF_NAME && process.env.GITHUB_REF_NAME !== expectedBranch) return fail("Activation must run from master.");
  if (process.env.PAYFAST_MODE !== "live") return fail("PAYFAST_MODE must be live.");
  if (process.env.PAYFAST_ENABLED === "true") return fail("PayFast is already enabled; use the incident procedure instead.");
  if (process.env.PAYFAST_CREDENTIAL_SET !== "live") return fail("Live credential set is required.");
  for (const variable of required) if (!process.env[variable]) return fail(`${variable} is missing.`);
  for (const variable of ["PAYFAST_RETURN_URL", "PAYFAST_CANCEL_URL", "PAYFAST_NOTIFY_URL"]) if (!process.env[variable].startsWith(productionUrl)) return fail(`${variable} must use the production HTTPS domain.`);
  await command(process.execPath, ["--test", "tests/payfast/payfast-core.test.mjs"]);
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question(`Type ENABLE PAYFAST ${expectedSiteId} to continue: `);
  prompt.close();
  if (answer !== `ENABLE PAYFAST ${expectedSiteId}`) return fail("Explicit confirmation did not match. No environment changes were made.");
  // Deliberately no local Netlify mutation: AGENTS.md requires KALM production
  // changes through the protected GitHub workflow with production approval.
  return fail("Preflight passed. Set PAYFAST_ENABLED=true in the protected storefront environment, then approve the GitHub production workflow and run its smoke test. No local production change was made.");
}

main().catch((error) => fail(error.message));
