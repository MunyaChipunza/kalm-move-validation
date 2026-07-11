#!/usr/bin/env node
/** Targeted catalogue integration for approved, versioned zero-paid image outputs. */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cataloguePath = path.join(root, "products.json");
const data = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(root, "reports/kalm-zero-paid-image-manifest.json"), "utf8"));
const outdoor = manifest.entries.filter((entry) => entry.workstream === "kalm_outdoor_accessory_concept" && entry.qaResult === "approved");
const move = manifest.entries.filter((entry) => entry.workstream === "kalm_move_women_buffalo_correction" && entry.qaResult === "approved");
const byProduct = new Map();
for (const entry of outdoor) {
  const items = byProduct.get(entry.productId) || [];
  items.push(entry);
  byProduct.set(entry.productId, items);
}
for (const product of data.products) {
  const images = byProduct.get(product.id);
  if (!images) continue;
  images.sort((a, b) => a.view.localeCompare(b.view));
  // Preserve the art-directed render sequence from the manifest, not lexical image names.
  const ordered = ["hero-three-quarter", "opposite-side", "component-layout", "material-detail", "lifestyle-use", "compatible-appliance"].map((view) => images.find((image) => image.view === view)?.proposedImagePath).filter(Boolean);
  product.image = ordered[0];
  product.gallery = ordered;
  product.conceptImageDisclosure = "Pre-production concept imagery. Final sourced product may vary.";
  product.imageProvenance = "Locally rendered KALM concept imagery; no supplier photography claim.";
}
const moveBySource = new Map(move.map((entry) => [entry.existingImagePath, entry.proposedImagePath]));
for (const product of data.products) {
  if (product.brand !== "KALM Move" || product.audience !== "women") continue;
  let defaultImage = product.image;
  const variants = product.variantImages || {};
  for (const variant of Object.values(variants)) {
    const nextGallery = (variant.gallery || []).map((source) => moveBySource.get(source) || source);
    if (nextGallery.length) {
      variant.gallery = nextGallery;
      variant.hero = moveBySource.get(variant.hero) || nextGallery[0];
      if (!defaultImage || product.image === variant.hero || product.image === (variant.gallery || [])[0]) defaultImage = variant.hero;
    }
  }
  const nextGallery = (product.gallery || []).map((source) => moveBySource.get(source) || source);
  if (nextGallery.length) product.gallery = nextGallery;
  if (moveBySource.has(product.image)) product.image = moveBySource.get(product.image);
  else if (defaultImage) product.image = defaultImage;
  if ([...moveBySource.keys()].some((source) => JSON.stringify(product).includes(source))) {
    product.imageProvenance = "Locally composited approved buffalo branding; source pixels outside recorded target regions are preserved.";
  }
}
fs.writeFileSync(cataloguePath, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ outdoorImages: outdoor.length, moveImages: move.length }, null, 2));
