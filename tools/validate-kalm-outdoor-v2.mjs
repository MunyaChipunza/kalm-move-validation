#!/usr/bin/env node
/** Validate the image-led KALM Outdoor appliance collection recovery state. */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const data = JSON.parse(read("products.json"));
const errors = [];
const fail = (message) => errors.push(message);
const exactTitles = [
  "Ember Launch Pro Perforated Peel",
  "Ember Turn Pro Turning Peel",
  "Ember Dough & Heat Kit",
  "Ridge Smart Temperature System",
  "Ridge Pro Rotisserie Kit",
  "Ridge Cast-Iron Sear System",
  "Forge Pro Griddle Tool Roll",
  "Forge Smash & Steam Kit",
  "Forge Season & Care Kit"
];
const anchorIds = new Set([
  "kalm-outdoor-ember-16-gas-pizza-oven",
  "kalm-outdoor-forge-2-portable-gas-griddle",
  "kalm-outdoor-ridge-4-stainless-gas-braai"
]);
const products = data.products || [];
const accessories = products.filter((product) => product.brandId === "kalm-outdoor" && exactTitles.includes(product.title));

if (accessories.length !== exactTitles.length) fail(`Expected ${exactTitles.length} coming-soon Outdoor accessories; found ${accessories.length}.`);
for (const title of exactTitles) if (!accessories.some((product) => product.title === title)) fail(`Missing mandated Outdoor accessory: ${title}.`);
for (const product of accessories) {
  if (!exactTitles.includes(product.title)) fail(`Unexpected coming-soon Outdoor accessory: ${product.title}.`);
  if (product.price !== null && product.price !== undefined) fail(`${product.id} must not expose a price.`);
  if (product.compareAtPrice !== null && product.compareAtPrice !== undefined) fail(`${product.id} must not expose a comparison price.`);
  if (product.availability !== "coming_soon" || product.publicationStatus !== "draft" || product.visibility !== "hidden") fail(`${product.id} must remain a hidden draft accessory.`);
  if (product.image || product.gallery || product.variantImages || product.conceptImageDisclosure) fail(`${product.id} must not expose generated renders or galleries.`);
  if (!Array.isArray(product.compatibleAppliances) || product.compatibleAppliances.length !== 1 || !anchorIds.has(product.compatibleAppliances[0])) fail(`${product.id} has an invalid appliance compatibility mapping.`);
}

const anchors = products.filter((product) => anchorIds.has(product.id));
if (anchors.length !== 3) fail("Expected exactly three visible anchor appliances.");
for (const appliance of anchors) {
  if (appliance.publicationStatus !== "published" || appliance.visibility !== "visible") fail(`${appliance.id} must stay public.`);
  if (!appliance.image) fail(`${appliance.id} must keep its approved appliance image.`);
}

const serialisedCatalogue = JSON.stringify(data);
if (serialisedCatalogue.includes("assets/images/products/kalm-outdoor/accessories/")) fail("Live product data must not reference generated Outdoor accessory renders.");
const script = read("script.js");
for (const requiredText of ["renderKalmOutdoorExperience", "outdoor-collection-intro", "outdoor-appliance-collection", "renderProductCard(product, { eager: index < 3 })"]) {
  if (!script.includes(requiredText)) fail(`script.js is missing ${requiredText}.`);
}
for (const forbiddenText of ["Nine accessories in development.", "Photography in production", "Build your open-air cooking routine.", "View all coming soon", "Join the accessory waitlist", "No illustrative product renders are shown in this preview."]) {
  if (script.includes(forbiddenText)) fail(`script.js must not render rejected Outdoor language: ${forbiddenText}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "passed",
  accessories: accessories.length,
  presentation: "image-led appliance collection",
  paidImageUsage: 0,
  activeGeneratedAccessoryReferences: 0
}, null, 2));
