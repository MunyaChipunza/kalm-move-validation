import catalogue from "../../../products.json" with { type: "json" };
import inventoryManifest from "../../../reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714/FINAL-INVENTORY-MANIFEST.json" with { type: "json" };
import { PayFastError } from "./payfast-core.mjs";

export const KALM_SELLER = Object.freeze({
  name: "KALM Collective (Pty) Ltd",
  registration: "2025/493384/07",
  supportEmail: "support@kalmcollective.co.za",
  currency: "ZAR"
});

export const PHASE_ONE_INVENTORY_SOURCE = Object.freeze({
  path: "reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714/FINAL-INVENTORY-MANIFEST.json",
  sha256: "4caac3bb544407718a90bad56860d4db85d7bcfbde355e94b4295292d46e7db2"
});

const PRODUCT_BY_CODE = new Map(
  catalogue.products
    .filter((product) => product.brandId === "ks-active" && /^KS-ARCH-P\d{3}$/.test(product.skuRoot || ""))
    .map((product) => [product.skuRoot.slice(-4), product])
);
const VARIANT_BY_SKU = new Map();

for (const row of inventoryManifest.variants || []) {
  const product = PRODUCT_BY_CODE.get(row.productCode);
  if (!product || product.brandId !== "ks-active" || product.publicationStatus !== "published" || product.visibility !== "visible") {
    throw new Error(`Phase 1 manifest references a non-public KS Active product: ${row.sku}`);
  }
  const matchingVariant = product.variants?.find((variant) => variant.sku === row.sku && variant.colour === row.colour && variant.size === row.size);
  if (!matchingVariant || !row.sku || !Number.isInteger(row.quantity) || row.quantity < 1) {
    throw new Error(`Phase 1 manifest variant cannot be validated: ${row.sku || "unknown"}`);
  }
  if (Math.round(Number(product.price) * 100) !== Math.round(Number(row.price) * 100)) {
    throw new Error(`Phase 1 manifest price mismatch: ${row.sku}`);
  }
  VARIANT_BY_SKU.set(row.sku, Object.freeze({
    sku: row.sku,
    productId: product.id,
    productCode: row.productCode,
    productName: row.productName,
    productSlug: product.slug,
    colour: row.colour,
    size: row.size,
    quantity: row.quantity,
    unitPriceCents: Math.round(Number(row.price) * 100)
  }));
}

export const PHASE_ONE_VARIANTS = Object.freeze([...VARIANT_BY_SKU.values()]);
export const PHASE_ONE_PRODUCT_IDS = Object.freeze([...new Set(PHASE_ONE_VARIANTS.map((variant) => variant.productId))]);
export const OWNER_TEST_PRODUCT_ID = "kalm-move-owner-payment-test";
export const OWNER_TEST_SHIPPING_CENTS = 0;
export const OWNER_TEST_VARIANTS = Object.freeze([
  "01", "02", "03", "04", "05"
].map((number) => Object.freeze({
  sku: `KALM-TEE-SIGNATURE-TEST-${number}`,
  productId: OWNER_TEST_PRODUCT_ID,
  productCode: `TEST-${number}`,
  productName: "KALM Signature Tee — Owner Payment Test",
  productSlug: "kalm-signature-tee-owner-payment-test",
  colour: "Black",
  size: `Test ${number}`,
  quantity: 1,
  unitPriceCents: 100
})));
const OWNER_TEST_VARIANT_BY_SKU = new Map(OWNER_TEST_VARIANTS.map((variant) => [variant.sku, variant]));

export function hasOwnerTestItems(items) {
  return Array.isArray(items) && items.some((item) => OWNER_TEST_VARIANT_BY_SKU.has(item?.sku));
}

export function isExclusiveOwnerTestOrder(items) {
  return Array.isArray(items) && items.length > 0 && items.every((item) => OWNER_TEST_VARIANT_BY_SKU.has(item?.sku));
}

function cleanText(value, maximum = 180) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maximum);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function buildAuthoritativeItems(requestedItems, { checkoutMode = "" } = {}) {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0 || requestedItems.length > 20) {
    throw new PayFastError(400, "invalid_cart", "Your bag needs at least one available item.");
  }
  const seen = new Set();
  const items = requestedItems.map((requested) => {
    const sku = cleanText(requested?.sku, 120);
    const quantity = Number(requested?.quantity);
    const authoritative = VARIANT_BY_SKU.get(sku) || (checkoutMode === "owner_test" ? OWNER_TEST_VARIANT_BY_SKU.get(sku) : null);
    if (!authoritative || !Number.isInteger(quantity) || quantity < 1 || quantity > 10 || seen.has(sku)) {
      throw new PayFastError(400, "unavailable_variant", "One or more selected variants are not available.");
    }
    seen.add(sku);
    return { ...authoritative, quantity, lineTotalCents: authoritative.unitPriceCents * quantity };
  });
  return items;
}

export function buildCustomer(value) {
  const name = cleanText(value?.name, 120);
  const email = cleanText(value?.email, 160).toLowerCase();
  const phone = cleanText(value?.phone, 40);
  if (!name || !validEmail(email) || !phone) {
    throw new PayFastError(400, "invalid_customer", "Enter your name, email address and phone number.");
  }
  return { name, email, phone };
}

export function buildDelivery(value) {
  const fields = ["address", "suburb", "city", "province", "postalCode"];
  const delivery = Object.fromEntries(fields.map((field) => [field, cleanText(value?.[field], field === "address" ? 180 : 80)]));
  if (Object.values(delivery).some((field) => !field)) {
    throw new PayFastError(400, "invalid_delivery", "Complete the delivery address before continuing.");
  }
  return delivery;
}

export function buildLegalAcceptance(value) {
  const accepted = {
    terms: value?.terms === true,
    delivery: value?.delivery === true,
    returns: value?.returns === true,
    acceptedAt: new Date().toISOString(),
    version: "2026-08-18"
  };
  if (!accepted.terms || !accepted.delivery || !accepted.returns) {
    throw new PayFastError(400, "legal_acceptance_required", "Accept the Terms, Delivery Policy and Returns & Refund Policy before payment.");
  }
  return accepted;
}

export function buildOrderDescription(items) {
  const units = items.reduce((total, item) => total + item.quantity, 0);
  return `${units} KALM Collective item${units === 1 ? "" : "s"}`;
}

export function validateIdempotencyKey(value) {
  const key = cleanText(value, 160);
  if (!/^[A-Za-z0-9._:-]{16,160}$/.test(key)) {
    throw new PayFastError(400, "invalid_idempotency_key", "Your checkout session has expired. Please try again.");
  }
  return key;
}

export function publicCommerceConfiguration(config) {
  return {
    checkoutMode: config.checkoutMode,
    standardShippingCents: config.shippingCents,
    firstWaveOrderCap: config.firstWaveOrderCap,
    seller: { name: KALM_SELLER.name, registration: KALM_SELLER.registration, currency: KALM_SELLER.currency }
  };
}
