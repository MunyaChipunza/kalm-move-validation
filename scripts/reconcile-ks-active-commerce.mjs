#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const inventoryPath = "reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714/FINAL-INVENTORY-MANIFEST.json";
const outputPath = resolve(root, "reports/KALM-PAYFAST-LAUNCH-READINESS-2026-08-18/PHASE-ONE-INVENTORY-RECONCILIATION.json");
const inventoryBuffer = await readFile(resolve(root, inventoryPath));
const inventory = JSON.parse(inventoryBuffer.toString("utf8"));
const catalogue = JSON.parse(await readFile(resolve(root, "products.json"), "utf8"));
const products = catalogue.products || [];
const manifestSku = new Map((inventory.variants || []).map((item) => [item.sku, item]));
const catalogueSku = new Map();
const findings = [];

for (const product of products) {
  for (const variant of product.variants || []) {
    if (!variant.sku) continue;
    if (catalogueSku.has(variant.sku)) findings.push({ level: "error", code: "duplicate_catalogue_sku", sku: variant.sku });
    catalogueSku.set(variant.sku, { product, variant });
  }
}

for (const [sku, row] of manifestSku) {
  const match = catalogueSku.get(sku);
  if (!match) { findings.push({ level: "error", code: "missing_catalogue_sku", sku }); continue; }
  const { product, variant } = match;
  if (product.brandId !== "ks-active" || product.publicationStatus !== "published" || product.visibility !== "visible" || product.launchDecision !== "Include") findings.push({ level: "error", code: "manifest_sku_not_public_phase_one", sku });
  if (variant.colour !== row.colour || variant.size !== row.size) findings.push({ level: "error", code: "variant_identity_mismatch", sku });
  if (Number(product.price) !== Number(row.price)) findings.push({ level: "error", code: "price_mismatch", sku, expected: row.price, actual: product.price });
  if (Number(variant.quantity) !== Number(row.quantity)) findings.push({ level: "error", code: "quantity_mismatch", sku, expected: row.quantity, actual: variant.quantity });
  if (!variant.enabled || !["in_stock", "low_stock"].includes(variant.availability)) findings.push({ level: "error", code: "manifest_sku_not_sellable", sku });
}

for (const [sku, { product, variant }] of catalogueSku) {
  const isPaidPhaseOne = product.brandId === "ks-active" && product.publicationStatus === "published" && product.visibility === "visible" && product.launchDecision === "Include" && variant.enabled && ["in_stock", "low_stock"].includes(variant.availability);
  if (isPaidPhaseOne && !manifestSku.has(sku)) findings.push({ level: "error", code: "orphan_public_sku", sku });
  if (Number(variant.quantity) < 0) findings.push({ level: "error", code: "negative_catalogue_quantity", sku });
  if (isPaidPhaseOne && Number(variant.quantity) === 0) findings.push({ level: "error", code: "public_zero_stock_sku", sku });
}

const result = {
  checkedAt: new Date().toISOString(),
  authoritativeInventory: {
    path: inventoryPath,
    sha256: createHash("sha256").update(inventoryBuffer).digest("hex"),
    products: new Set((inventory.variants || []).map((row) => row.productCode)).size,
    stockedColours: inventory.stockedColours,
    physicalSkus: manifestSku.size,
    physicalUnits: [...manifestSku.values()].reduce((sum, row) => sum + Number(row.quantity || 0), 0)
  },
  publicCatalogue: { products: products.filter((product) => product.brandId === "ks-active" && product.publicationStatus === "published" && product.visibility === "visible" && product.launchDecision === "Include").length, skus: [...catalogueSku.values()].filter(({ product }) => product.brandId === "ks-active" && product.publicationStatus === "published" && product.visibility === "visible" && product.launchDecision === "Include").length },
  serverInventorySeed: { migration: "netlify/database/migrations/20260818000200_seed_ks_active_archive_inventory.sql", expectedSkus: manifestSku.size, expectedUnits: [...manifestSku.values()].reduce((sum, row) => sum + Number(row.quantity || 0), 0) },
  findings,
  status: findings.some((finding) => finding.level === "error") ? "fail" : "pass"
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ status: result.status, products: result.authoritativeInventory.products, physicalSkus: result.authoritativeInventory.physicalSkus, physicalUnits: result.authoritativeInventory.physicalUnits, findings: findings.length, output: outputPath }, null, 2));
if (result.status !== "pass") process.exit(1);
