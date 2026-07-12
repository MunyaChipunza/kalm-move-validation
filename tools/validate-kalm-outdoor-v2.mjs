#!/usr/bin/env node
/** Validate the neutral-card, no-render KALM Outdoor coming-soon recovery state. */

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
const accessories = products.filter((product) => product.brandId === "kalm-outdoor" && product.comingSoon === true);
const expectedStatus = "Photography in production. Product images will be published after supplier approval.";

if (accessories.length !== exactTitles.length) fail(`Expected ${exactTitles.length} coming-soon Outdoor accessories; found ${accessories.length}.`);
for (const title of exactTitles) if (!accessories.some((product) => product.title === title)) fail(`Missing mandated Outdoor accessory: ${title}.`);
for (const product of accessories) {
  if (!exactTitles.includes(product.title)) fail(`Unexpected coming-soon Outdoor accessory: ${product.title}.`);
  if (product.price !== null && product.price !== undefined) fail(`${product.id} must not expose a price.`);
  if (product.compareAtPrice !== null && product.compareAtPrice !== undefined) fail(`${product.id} must not expose a comparison price.`);
  if (product.availability !== "coming_soon" || product.publicationStatus !== "published" || product.visibility !== "visible") fail(`${product.id} has an invalid coming-soon publication state.`);
  if (product.image || product.gallery || product.variantImages || product.conceptImageDisclosure) fail(`${product.id} must not expose generated renders or galleries.`);
  if (product.photographyStatus !== expectedStatus) fail(`${product.id} must state the recovery photography status.`);
  if (product.ctaLabel !== "Join waitlist") fail(`${product.id} must use Join waitlist as its CTA.`);
  if (!Array.isArray(product.compatibleAppliances) || product.compatibleAppliances.length !== 1 || !anchorIds.has(product.compatibleAppliances[0])) fail(`${product.id} has an invalid appliance compatibility mapping.`);
}

const serialisedCatalogue = JSON.stringify(data);
if (serialisedCatalogue.includes("assets/images/products/kalm-outdoor/accessories/")) fail("Live product data must not reference generated Outdoor accessory renders.");
const script = read("script.js");
for (const requiredText of ["renderComingSoonMedia", "coming-soon-media", "card-compatibility", "data-waitlist-form", "outdoor-hero--text", "No illustrative product renders are shown in this preview."]) {
  if (!script.includes(requiredText)) fail(`script.js is missing ${requiredText}.`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "passed",
  accessories: accessories.length,
  presentation: "neutral-card",
  paidImageUsage: 0,
  activeGeneratedAccessoryReferences: 0
}, null, 2));
