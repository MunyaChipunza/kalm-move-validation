#!/usr/bin/env node
/** Confirm the recovery removes failed visual outputs from all active catalogue references. */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8").replace(/^\uFEFF/, ""));
const errors = [];
const fail = (message) => errors.push(message);
const assertion = readJson("reports/zero-paid-image-assertion.json");
const manifest = readJson("reports/kalm-zero-paid-image-manifest.json");
const catalogue = readJson("products.json");
const recovery = readJson("reports/visual-recovery-source-audit.json");
const bottleStage2 = readJson("reports/KALM-MOVE-BOTTLES-STAGE2-20260712/product-image-manifest.json");
const bottleOverrideIds = new Set([
  "kalm-move-everyday-bottle",
  "kalm-move-slim-wellness-bottle",
  "kalm-move-studio-bottle",
  "kalm-move-protein-shaker-bottle",
  "kalm-move-all-day-straw-tumbler"
]);

if (assertion.status !== "passed" || assertion.paidImageUsage !== 0 || manifest.paidImageUsage !== 0) fail("Zero-paid-image assertion did not pass at usage 0.");
for (const product of catalogue.products.filter((item) => item.brandId === "kalm-move" && item.audience === "women")) {
  if (JSON.stringify({ image: product.image, gallery: product.gallery, variantImages: product.variantImages }).includes("-v3/")) fail(`Failed v3 reference remains active: ${product.id}`);
}
for (const product of catalogue.products.filter((item) => item.brandId === "kalm-outdoor" && item.comingSoon)) {
  if (product.image || product.gallery || product.variantImages) fail(`Generated Outdoor render remains active: ${product.id}`);
}
for (const product of catalogue.products.filter((item) => item.brandId === "kalm-move" && item.audience === "men" && !bottleOverrideIds.has(item.id))) {
  const images = JSON.stringify({ image: product.image, gallery: product.gallery, variantImages: product.variantImages });
  if (/men-recovery-v2|men-embedded-logo-v3/.test(images)) fail(`Old or unapproved staged Men path remains active: ${product.id}`);
  if (!images.includes("assets/images/products/kalm-move/men/") || !images.includes("-v4/")) fail(`Men V4 recovery path is not active: ${product.id}`);
}
const bottle = catalogue.products.find((item) => item.id === "kalm-move-studio-bottle");
if (!JSON.stringify(bottle).includes("assets/images/products/kalm-move/bottles-v2/studio-bottle/")) fail("Studio Bottle Stage 2 recovery path is not active.");
if (bottleStage2.assetCount !== 60 || bottleStage2.assets.some((asset) => asset.reviewSha256 !== asset.publicSha256)) fail("The approved Bottle Stage 2 asset manifest is incomplete or has hash drift.");
if (recovery.recoveredWomen.length !== 19 || recovery.recoveredMen.length !== 11 || recovery.removedOutdoorReferences.length !== 9) fail("Recovery audit counts are incorrect.");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(JSON.stringify({
  status: "passed",
  paidImageUsage: 0,
  womenV3ActiveReferences: 0,
  outdoorGeneratedActiveReferences: 0,
  menRecoveryProducts: recovery.recoveredMen.length,
  menV4Products: catalogue.products.filter((item) => item.brandId === "kalm-move" && item.audience === "men" && !bottleOverrideIds.has(item.id)).length,
  bottleStage2ApprovedAssets: bottleStage2.assetCount
}, null, 2));
