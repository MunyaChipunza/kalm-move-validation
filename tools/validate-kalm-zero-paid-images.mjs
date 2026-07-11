#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8").replace(/^\uFEFF/, ""));
const errors = [];
const fail = (message) => errors.push(message);
const manifest = readJson("reports/kalm-zero-paid-image-manifest.json");
const assertion = readJson("reports/zero-paid-image-assertion.json");
const catalogue = readJson("products.json");
const outdoor = manifest.entries.filter((entry) => entry.workstream === "kalm_outdoor_accessory_concept");
const move = manifest.entries.filter((entry) => entry.workstream === "kalm_move_women_buffalo_correction");
const bottles = manifest.entries.filter((entry) => entry.workstream === "kalm_move_women_bottle_preservation");

function webpDimensions(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return [0, 0];
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString("ascii", offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (type === "VP8X") return [1 + buffer.readUIntLE(data + 4, 3), 1 + buffer.readUIntLE(data + 7, 3)];
    if (type === "VP8 " && data + 10 <= buffer.length) return [buffer.readUInt16LE(data + 6) & 0x3fff, buffer.readUInt16LE(data + 8) & 0x3fff];
    if (type === "VP8L" && data + 5 <= buffer.length) {
      const bits = buffer.readUInt32LE(data + 1);
      return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)];
    }
    offset = data + length + (length % 2);
  }
  return [0, 0];
}

if (assertion.status !== "passed" || assertion.paidImageUsage !== 0 || manifest.paidImageUsage !== 0) fail("Zero-paid-image assertion did not pass at usage 0.");
if (outdoor.length !== 54 || !outdoor.every((entry) => entry.qaResult === "approved")) fail("Expected 54 approved Outdoor concept images.");
if (move.length !== 294 || !move.every((entry) => entry.qaResult === "approved")) fail("Expected 294 approved KALM Move garment images.");
if (bottles.length !== 26 || !bottles.every((entry) => entry.qaResult === "preserved_existing")) fail("Expected 26 preserved bottle images.");
const paths = new Set();
for (const entry of [...outdoor, ...move]) {
  const target = path.join(root, entry.proposedImagePath);
  if (paths.has(entry.proposedImagePath)) fail(`Duplicate approved image path: ${entry.proposedImagePath}`);
  paths.add(entry.proposedImagePath);
  if (!fs.existsSync(target)) { fail(`Missing output: ${entry.proposedImagePath}`); continue; }
  const stat = fs.statSync(target);
  if (stat.size < 8_000 || stat.size > 3_000_000) fail(`Unexpected image file size: ${entry.proposedImagePath}`);
  const hash = crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex");
  if (entry.finalHash !== hash) fail(`Hash mismatch: ${entry.proposedImagePath}`);
  const [width, height] = webpDimensions(target);
  if (!width || !height) fail(`Unreadable WebP: ${entry.proposedImagePath}`);
  if (entry.workstream === "kalm_outdoor_accessory_concept" && (width !== 1200 || height !== 1500)) fail(`Outdoor image has wrong dimensions: ${entry.proposedImagePath}`);
  if (entry.workstream === "kalm_outdoor_accessory_concept" && Math.abs(width / height - 0.8) > 0.001) fail(`Outdoor image has wrong aspect ratio: ${entry.proposedImagePath}`);
}
for (const product of catalogue.products.filter((item) => item.brandId === "kalm-outdoor" && item.comingSoon)) {
  if (product.price !== null || product.compareAtPrice !== null || product.ctaLabel !== "Join waitlist") fail(`Coming-soon safety regression: ${product.id}`);
  if (!product.conceptImageDisclosure || product.gallery?.length !== 6 || product.variants?.length || Object.keys(product.variantImages || {}).length) fail(`Outdoor concept gallery integration failure: ${product.id}`);
}
for (const product of catalogue.products.filter((item) => item.brand === "KALM Move" && item.audience === "women")) {
  const allImages = JSON.stringify(product);
  if (product.title.toLowerCase().includes("bottle") ? allImages.includes("-v3/") : !allImages.includes("-v3/")) fail(`Mixed or missing Move version paths: ${product.id}`);
  for (const variant of Object.values(product.variantImages || {})) {
    const gallery = variant.gallery || [];
    if (gallery.some((image) => image.includes("-v3/")) && gallery.some((image) => !image.includes("-v3/"))) fail(`Mixed old/new gallery paths: ${product.id}`);
  }
}
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
if (!script.includes("conceptImageDisclosure") || !script.includes("isComingSoonProduct(product)")) fail("Storefront is missing concept disclosure or coming-soon guard.");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(JSON.stringify({ status: "passed", outdoorApproved: outdoor.length, moveApproved: move.length, bottlePreserved: bottles.length, paidImageUsage: 0 }, null, 2));
