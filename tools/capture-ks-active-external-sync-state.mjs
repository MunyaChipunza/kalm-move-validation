import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "reports", "KS-ACTIVE-ARCHIVE", "FINAL-PRODUCTION-RELEASE-20260714");
const now = new Date().toISOString();

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

async function getJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 2000) };
  }
  return {
    url,
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get("content-type"),
    json,
  };
}

const products = readJson("reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714/FINAL-PRODUCT-MANIFEST.json");
const inventory = readJson("reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714/FINAL-INVENTORY-MANIFEST.json");
const prices = readJson("reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714/FINAL-PRICE-MANIFEST.json");
const removal = readJson("reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714/LEGACY-KS-ACTIVE-PUBLIC-REMOVAL-MANIFEST.json");

const expected = {
  products: products.products.length,
  stockedColours: inventory.totals.stockedColours,
  physicalSkus: inventory.variants.length,
  physicalUnits: inventory.totals.physicalLaunchQuantity,
  approvedAssets: inventory.totals.approvedGeneratedPublicAssets,
  legacyProductsToArchive: removal.removedLegacyProducts.length,
};

const [inventoryStatus, inventoryItems, commerceProducts, ecommerceProducts] = await Promise.all([
  getJson("https://intranet.kalmcollective.co.za/api/inventory/status"),
  getJson("https://intranet.kalmcollective.co.za/api/inventory/items"),
  getJson("https://intranet.kalmcollective.co.za/api/commerce/products"),
  getJson("https://intranet.kalmcollective.co.za/api/ecommerce/products"),
]);

const commerceRows = Array.isArray(commerceProducts.json) ? commerceProducts.json : [];
const ecommerceRows = Array.isArray(ecommerceProducts.json?.data) ? ecommerceProducts.json.data : [];
const currentKsCommerce = commerceRows.filter((item) => item.brand === "KS Active" || item.brandId === "ks-active");
const currentKsEcommerce = ecommerceRows.filter((item) => item.brand === "KS Active" || item.brandId === "ks-active");
const zohoData = Array.isArray(inventoryItems.json?.data) ? inventoryItems.json.data : [];

const writeCapability = Array.isArray(inventoryStatus.json?.capabilities)
  ? inventoryStatus.json.capabilities.find((capability) => capability.key === "items")?.write === true
  : false;

const zohoBefore = {
  schemaVersion: 1,
  capturedAt: now,
  source: "KALM intranet /api/inventory/items backed by Zoho Inventory plus authenticated Zoho UI observation",
  authenticatedZohoReadAccess: true,
  organizationObservedInZohoUi: "KALM Collective",
  provider: inventoryItems.json?.provider || inventoryStatus.json?.key || "unknown",
  endpoint: inventoryItems.url,
  endpointStatus: inventoryItems.status,
  itemWriteCapability: writeCapability,
  itemCount: zohoData.length,
  ksActiveItemCount: zohoData.filter((item) => JSON.stringify(item).toLowerCase().includes("ks active")).length,
  items: zohoData,
  legacyProductsExpectedForArchive: removal.removedLegacyProducts,
  conflicts: [],
  blocker: writeCapability
    ? null
    : "The authenticated intranet Zoho Inventory integration reports item write=false; no supported Zoho API or connector write path is available in this environment.",
};

const intranetBefore = {
  schemaVersion: 1,
  capturedAt: now,
  source: "KALM intranet commerce/ecommerce read APIs",
  authenticatedIntranetReadAccess: true,
  commerceEndpoint: {
    url: commerceProducts.url,
    status: commerceProducts.status,
    count: commerceRows.length,
  },
  ecommerceEndpoint: {
    url: ecommerceProducts.url,
    status: ecommerceProducts.status,
    count: ecommerceRows.length,
  },
  currentKsCommerceCount: currentKsCommerce.length,
  currentKsEcommerceCount: currentKsEcommerce.length,
  currentKsCommerce,
  currentKsEcommerce,
  legacyProductsExpectedForArchive: removal.removedLegacyProducts,
  conflicts: currentKsCommerce.filter((item) => !String(item.id || "").startsWith("ks-active-archive-")).map((item) => ({
    id: item.id,
    title: item.title,
    skuRoot: item.skuRoot,
    status: item.publicationStatus,
    visibility: item.visibility,
  })),
  blocker: "The live intranet commerce catalogue is read-only from available APIs. Product publication is server-side Git/Netlify oriented and does not expose a supported SKU-level intranet sync endpoint.",
};

const reconcile = {
  schemaVersion: 1,
  capturedAt: now,
  passed: false,
  status: "blocked",
  expected,
  zoho: {
    readAccess: true,
    itemCount: zohoData.length,
    itemWriteCapability: writeCapability,
    synchronized: false,
  },
  intranet: {
    readAccess: true,
    currentKsCommerceCount: currentKsCommerce.length,
    synchronized: false,
  },
  releaseCandidate: {
    products: expected.products,
    physicalSkus: expected.physicalSkus,
    physicalUnits: expected.physicalUnits,
    prices: prices.prices.length,
  },
  blockingGates: [
    "zohoInventoryWritePathUnavailable",
    "intranetSkuSyncEndpointUnavailable",
    "threeSystemReconciliationNotPossible",
  ],
  reason: "External synchronization cannot be completed without a supported Zoho write path and a supported intranet SKU/product sync endpoint. No Zoho, intranet, GitHub, Netlify or production data was modified.",
};

fs.writeFileSync(path.join(outDir, "ZOHO-BEFORE-SYNC.json"), `${JSON.stringify(zohoBefore, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, "INTRANET-BEFORE-SYNC.json"), `${JSON.stringify(intranetBefore, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, "THREE-SYSTEM-RECONCILIATION.json"), `${JSON.stringify(reconcile, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, "EXTERNAL-SYNC-BLOCKER.json"), `${JSON.stringify({
  schemaVersion: 1,
  capturedAt: now,
  protectedReleaseCommit: "53e3dd3bbdd15ebec6ddcf3a0418d8da6ae23c04",
  expected,
  blockers: reconcile.blockingGates,
  zohoBeforePath: "reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714/ZOHO-BEFORE-SYNC.json",
  intranetBeforePath: "reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714/INTRANET-BEFORE-SYNC.json",
  noExternalMutationPerformed: true,
}, null, 2)}\n`);

console.log(JSON.stringify({
  capturedAt: now,
  expected,
  zohoItemCount: zohoData.length,
  zohoWriteCapability: writeCapability,
  intranetKsProducts: currentKsCommerce.length,
  blocked: true,
}, null, 2));
