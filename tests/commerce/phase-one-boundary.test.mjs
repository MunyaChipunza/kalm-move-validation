import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  PHASE_ONE_PRODUCT_IDS,
  PHASE_ONE_VARIANTS,
  buildAuthoritativeItems
} from "../../netlify/functions/_shared/commerce-core.mjs";
import { PayFastError, assertCheckoutMode, getPayFastConfig } from "../../netlify/functions/_shared/payfast-core.mjs";

test("Phase 1 accepts exactly the reconciled KS Active Archive scope", () => {
  assert.equal(PHASE_ONE_PRODUCT_IDS.length, 14);
  assert.equal(PHASE_ONE_VARIANTS.length, 104);
  assert.equal(PHASE_ONE_VARIANTS.reduce((total, item) => total + item.quantity, 0), 111);
  assert(PHASE_ONE_VARIANTS.every((item) => item.productId.startsWith("ks-active-archive-")));
  assert(PHASE_ONE_VARIANTS.every((item) => item.unitPriceCents >= 39900));
});

test("the server accepts only a reconciled SKU and refuses client-invented inventory", () => {
  const allowed = PHASE_ONE_VARIANTS[0];
  const result = buildAuthoritativeItems([{ sku: allowed.sku, quantity: 1 }]);
  assert.equal(result[0].sku, allowed.sku);
  assert.equal(result[0].unitPriceCents, allowed.unitPriceCents);
  assert.throws(() => buildAuthoritativeItems([{ sku: "KALM-TEE-SIGNATURE-001-BLK-M", quantity: 1 }]), PayFastError);
  assert.throws(() => buildAuthoritativeItems([{ sku: allowed.sku, quantity: 0 }]), PayFastError);
});

test("owner-test checkout cannot admit a non-allowlisted customer", () => {
  const config = getPayFastConfig((name) => ({ CHECKOUT_MODE: "owner_test", OWNER_TEST_EMAILS: "owner@example.test" })[name]);
  assert.doesNotThrow(() => assertCheckoutMode(config, "owner@example.test"));
  assert.throws(() => assertCheckoutMode(config, "customer@example.test"), { code: "owner_test_access_required" });
});

test("database seed is traceable to the 104-variant physical inventory manifest", async () => {
  const source = await readFile(new URL("../../netlify/database/migrations/20260818000200_seed_ks_active_archive_inventory.sql", import.meta.url), "utf8");
  assert.match(source, /source sha256: 4caac3bb544407718a90bad56860d4db85d7bcfbde355e94b4295292d46e7db2/);
  assert.equal((source.match(/\('KS-ARCH-/g) || []).length, 104);
  assert.match(source, /ON CONFLICT \(sku\) DO NOTHING/);
});

test("the public checkout does not offer a bypass payment method", async () => {
  const source = await readFile(new URL("../../script.js", import.meta.url), "utf8");
  assert.match(source, /\/api\/payments\/payfast\/initiate/);
  assert.doesNotMatch(source, /value="Ozow"|value="EFT"|value="Paystack"/);
  assert.match(source, /Standard courier — South Africa/);
  assert.match(source, /dispatch and delivery in 2 to 5 business days/);
});
