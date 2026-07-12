#!/usr/bin/env node
/** Validate the preview-only rollback of failed KALM Move women v3 composites. */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };
const allImages = (value) => {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allImages);
  if (typeof value === "object") return Object.values(value).flatMap(allImages);
  return [];
};

const catalogue = readJson("products.json");
const audit = readJson("reports/visual-recovery-source-audit.json");
const women = catalogue.products.filter((product) => product.brandId === "kalm-move" && product.audience === "women");
const womenById = new Map(women.map((product) => [product.id, product]));
const expectedWomenSource = "07258b3a6f2960718750a78b57a01f9537d4ce34";
const expectedBottleSource = "5d33e4b415ee0834a08d5cc7cbcebdd3bfa5d5ee";

assert(audit.sourceCommits.women === expectedWomenSource, "Women recovery must cite the approved pre-v3 source commit.");
assert(audit.sourceCommits.studioBottle === expectedBottleSource, "Studio Bottle recovery must cite its clean source commit.");
assert(audit.recoveredWomen.length === 19, "Expected exactly 19 recovered KALM Move women garment records.");
assert(new Set(audit.recoveredWomen).size === audit.recoveredWomen.length, "Recovered women list contains duplicates.");

for (const id of audit.recoveredWomen) {
  const product = womenById.get(id);
  assert(product, `Recovered women product missing from catalogue: ${id}`);
  const images = allImages({ image: product.image, gallery: product.gallery, variantImages: product.variantImages });
  assert(images.length > 0, `${id} must keep source product imagery.`);
  assert(images.every((image) => !image.includes("-v3/")), `${id} still references failed v3 imagery.`);
  assert(images.every((image) => fs.existsSync(path.join(root, image))), `${id} references a missing recovered image.`);
}

const bottle = womenById.get("kalm-move-studio-bottle");
assert(bottle, "Studio Bottle record is missing.");
const bottleImages = Array.from(new Set(allImages({ image: bottle.image, gallery: bottle.gallery, variantImages: bottle.variantImages })));
assert(bottleImages.length === 8, "Studio Bottle must retain the eight approved V4 front/alternate photography views.");
assert(bottleImages.every((image) => image.startsWith("assets/images/products/kalm-move/bottles-v4/studio-bottle/")), "Studio Bottle must use final V4 bottle paths only.");
assert(bottleImages.every((image) => fs.existsSync(path.join(root, image))), "Studio Bottle V4 image is missing.");
assert(JSON.stringify(bottle.colors) === JSON.stringify(["Black", "Stone", "Lilac", "Sky Blue"]), "Studio Bottle must expose only the approved Stage 2 colours.");

console.log(JSON.stringify({
  status: "passed",
  recoveredWomen: audit.recoveredWomen.length,
  studioBottleStage2Images: bottleImages.length,
  womenSource: expectedWomenSource,
  studioBottleSource: expectedBottleSource
}, null, 2));
