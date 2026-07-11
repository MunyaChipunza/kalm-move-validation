#!/usr/bin/env node
/** Validate the photo-honest KALM Outdoor V2 coming-soon release gate. */

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
const exactBundleTitles = ["Ember Essential", "Pizza Night", "Ridge Precision", "Ridge Host", "Forge Essential", "Forge Burger"];
const anchorIds = new Set([
  "kalm-outdoor-ember-16-gas-pizza-oven",
  "kalm-outdoor-forge-2-portable-gas-griddle",
  "kalm-outdoor-ridge-4-stainless-gas-braai"
]);
const products = data.products || [];
const productById = new Map(products.map((product) => [product.id, product]));
const accessories = products.filter((product) => product.brandId === "kalm-outdoor" && product.comingSoon === true);

if (accessories.length !== exactTitles.length) fail(`Expected ${exactTitles.length} coming-soon Outdoor accessories; found ${accessories.length}.`);
for (const title of exactTitles) {
  if (!accessories.some((product) => product.title === title)) fail(`Missing mandated Outdoor accessory: ${title}.`);
}
for (const product of accessories) {
  if (!exactTitles.includes(product.title)) fail(`Unexpected coming-soon Outdoor accessory: ${product.title}.`);
  if (product.price !== null && product.price !== undefined) fail(`${product.id} must not expose a price.`);
  if (product.compareAtPrice !== null && product.compareAtPrice !== undefined) fail(`${product.id} must not expose a comparison price.`);
  if (product.availability !== "coming_soon" || product.publicationStatus !== "published" || product.visibility !== "visible") fail(`${product.id} has an invalid coming-soon publication state.`);
  if (product.image || (product.gallery || []).length || Object.keys(product.variantImages || {}).length || (product.variants || []).length) fail(`${product.id} must not reference product imagery or variants.`);
  if (product.photographyStatus !== "Photography in production") fail(`${product.id} must expose the Photography in production status.`);
  if (product.ctaLabel !== "Join waitlist") fail(`${product.id} must use Join waitlist as its CTA.`);
  if (!Array.isArray(product.compatibleAppliances) || product.compatibleAppliances.length !== 1 || !anchorIds.has(product.compatibleAppliances[0])) fail(`${product.id} has an invalid appliance compatibility mapping.`);
}

for (const anchorId of anchorIds) {
  const anchor = productById.get(anchorId);
  if (!anchor?.image || !fs.existsSync(path.join(root, anchor.image))) fail(`Missing approved anchor image for ${anchorId}.`);
  if (!Array.isArray(anchor.relatedProducts) || !anchor.relatedProducts.some((id) => accessories.some((product) => product.id === id))) fail(`${anchorId} is missing accessory cross-sells.`);
}

const bundles = data.outdoorBundles || [];
if (bundles.length !== exactBundleTitles.length) fail(`Expected ${exactBundleTitles.length} Outdoor bundle roadmaps; found ${bundles.length}.`);
for (const title of exactBundleTitles) {
  if (!bundles.some((bundle) => bundle.title === title)) fail(`Missing mandated Outdoor bundle: ${title}.`);
}
for (const bundle of bundles) {
  if (!exactBundleTitles.includes(bundle.title)) fail(`Unexpected Outdoor bundle: ${bundle.title}.`);
  if (bundle.status !== "coming_soon") fail(`${bundle.id} must be coming soon.`);
  if ("price" in bundle || "stock" in bundle || "availability" in bundle || "savings" in bundle) fail(`${bundle.id} must not expose price, stock, availability, or savings.`);
  if (!anchorIds.has(bundle.compatibleAppliance)) fail(`${bundle.id} has an invalid appliance anchor.`);
  if (!Array.isArray(bundle.accessoryIds) || !bundle.accessoryIds.length || bundle.accessoryIds.some((id) => !accessories.some((product) => product.id === id))) fail(`${bundle.id} has invalid accessory membership.`);
}

const serialisedCatalogue = JSON.stringify(data);
if (/\.svg/i.test(serialisedCatalogue)) fail("Live product data must not reference SVG concept assets.");
const script = read("script.js");
const index = read("index.html");
for (const requiredText of ["data-waitlist-form", "Photography in production", "isComingSoonProduct", "renderOutdoorApplianceFilter"]) {
  if (!script.includes(requiredText)) fail(`script.js is missing ${requiredText}.`);
}
for (const field of ["name=\"name\"", "name=\"email\"", "name=\"phone\"", "name=\"accessory_or_bundle\"", "name=\"compatible_appliance\"", "name=\"owns_compatible_appliance\"", "name=\"consent\"", "name=\"source\""]) {
  if (!index.includes(field)) fail(`Netlify waitlist fallback is missing ${field}.`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "passed",
  accessories: accessories.length,
  bundles: bundles.length,
  approved_anchor_images: anchorIds.size,
  paid_image_usage: 0,
  live_svg_product_references: 0
}, null, 2));
