import fs from "node:fs";

const script = fs.readFileSync("script.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const products = JSON.parse(fs.readFileSync("products.json", "utf8"));

const requiredFields = [
  "eventId",
  "eventType",
  "createdAt",
  "anonymousVisitorId",
  "productId",
  "productSlug",
  "productTitle",
  "brand",
  "productStatus",
  "pagePath",
  "cardPosition",
  "sourceCollection",
  "experimentId",
  "experimentVariant",
  "action",
  "preferredSize",
  "preferredColour",
  "priceBand",
  "optionalEmail",
  "notificationConsent",
  "marketingConsent",
  "referrer",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "userAgentClass",
  "viewportClass"
];

const failures = [];
const fail = (message) => failures.push(message);

if (!script.includes('futureDemandExperimentId = "wishlist-cta-copy-v1"')) {
  fail("Missing wishlist-cta-copy-v1 experiment.");
}

if (!index.includes('name="kalm-future-demand-event"')) {
  fail("Missing Netlify Forms fallback event form.");
}

for (const field of requiredFields) {
  if (!index.includes(`name="${field}"`)) fail(`Missing event field in Netlify form: ${field}`);
}

for (const forbidden of ["available soon", "launching shortly", "arriving soon", "pre-order", "reserve now"]) {
  if (script.toLowerCase().includes(forbidden)) fail(`Forbidden future-commerce phrase present: ${forbidden}`);
}

for (const required of [
  "In consideration",
  "No launch date has been set. Add this to your wishlist to help us decide what to develop or source first.",
  "Add to wishlist",
  "Vote for this product",
  "On your wishlist",
  "Help us get this right",
  "Notify me if this product is selected"
]) {
  if (!script.includes(required)) fail(`Missing required wishlist copy: ${required}`);
}

const ksArchiveVisible = products.products.filter((product) => (
  product.brandId === "ks-active"
  && (product.publicationStatus || "published") === "published"
  && (product.visibility || "visible") === "visible"
));
const ksLegacyHidden = products.products.filter((product) => (
  product.brandId === "ks-active"
  && ((product.publicationStatus || "published") !== "published" || (product.visibility || "visible") !== "visible")
));
const skuCount = ksArchiveVisible.reduce((sum, product) => sum + (product.variants || []).filter((variant) => variant.enabled !== false).length, 0);
const unitCount = ksArchiveVisible.reduce((sum, product) => sum + (product.variants || []).reduce((inner, variant) => inner + (Number(variant.quantity) || 0), 0), 0);

if (ksArchiveVisible.length !== 14) fail(`Expected 14 visible KS Active archive products, found ${ksArchiveVisible.length}.`);
if (ksLegacyHidden.length !== 6) fail(`Expected 6 hidden legacy KS Active products, found ${ksLegacyHidden.length}.`);
if (skuCount !== 104) fail(`Expected 104 KS Active SKUs, found ${skuCount}.`);
if (unitCount !== 111) fail(`Expected 111 KS Active units, found ${unitCount}.`);

const brandCounts = {};
const candidateMatches = [...script.matchAll(/brandId: "(kalm-[a-z]+)"/g)];
for (const match of candidateMatches) brandCounts[match[1]] = (brandCounts[match[1]] || 0) + 1;
for (const brandId of ["kalm-move", "kalm-wellness", "kalm-home", "kalm-outdoor"]) {
  const count = brandCounts[brandId] || 0;
  if (count < 1 || count > 5) fail(`Future shortlist for ${brandId} must contain 1-5 candidates; found ${count}.`);
}
if (brandCounts["ks-active"]) fail("KS Active must not be included in future wishlist candidate records.");

const futureCardFunction = script.slice(script.indexOf("function renderFutureCandidateCard"), script.indexOf("function renderFutureWishlistControl"));
if (futureCardFunction.includes("data-add-to-bag")) {
  fail("Future candidate card appears to expose add-to-bag.");
}

if (!script.includes("setStructuredData({ type: \"website\" })")) {
  fail("Future pages must avoid product Offer structured data.");
}

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({
  passed: true,
  experimentId: "wishlist-cta-copy-v1",
  storageMethod: "Netlify Forms fallback",
  ksActiveVisibleProducts: ksArchiveVisible.length,
  hiddenLegacyKsActiveProducts: ksLegacyHidden.length,
  ksActiveSkuCount: skuCount,
  ksActiveUnitCount: unitCount,
  futureCandidateCounts: brandCounts
}, null, 2));
