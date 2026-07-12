import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const hash = (relative) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relative))).digest("hex");
const catalog = readJson("products.json");
const manifest = readJson("reports/KALM-MOVE-BOTTLES-STAGE2-20260712/product-image-manifest.json");
const bottleIds = [
  "kalm-move-everyday-bottle",
  "kalm-move-slim-wellness-bottle",
  "kalm-move-studio-bottle",
  "kalm-move-protein-shaker-bottle",
  "kalm-move-all-day-straw-tumbler"
];

assert(manifest.assetCount === 60 && manifest.assets.length === 60, "Bottle manifest must contain exactly 60 approved review assets.");
for (const asset of manifest.assets) {
  assert(asset.publicPath.startsWith("assets/images/products/kalm-move/bottles-v2/"), `Public path is not a fresh bottle path: ${asset.publicPath}`);
  assert(!asset.publicPath.includes("reports/") && !asset.publicPath.includes("draft"), `Review-only image path leaked into public catalogue: ${asset.publicPath}`);
  assert(fs.existsSync(path.join(root, asset.publicPath)), `Missing copied public asset: ${asset.publicPath}`);
  assert(hash(asset.publicPath) === asset.publicSha256, `Public asset hash drift: ${asset.publicPath}`);
  assert(asset.reviewSha256 === asset.publicSha256, `Source hash mismatch: ${asset.publicPath}`);
  const correctedPath = asset.publicPath.replace("bottles-v2", "bottles-v3");
  assert(fs.existsSync(path.join(root, correctedPath)), `Missing final immutable asset: ${correctedPath}`);
  assert(hash(correctedPath) === asset.reviewSha256, `Final immutable asset hash drift: ${correctedPath}`);
}

for (const id of bottleIds) {
  const product = catalog.products.find((item) => item.id === id);
  assert(product, `Missing scoped bottle product: ${id}`);
  assert(product.publicationStatus === "published" && product.visibility === "visible", `${id} must be visibly published.`);
  assert(product.image.startsWith("assets/images/products/kalm-move/bottles-v3/"), `${id} does not use the final immutable bottle asset.`);
  for (const colour of product.colors) {
    const imageSet = product.variantImages?.[colour];
    assert(imageSet?.gallery?.length === 3, `${id} ${colour} does not expose front, angle and detail imagery.`);
    for (const image of imageSet.gallery) {
      assert(manifest.assets.some((asset) => asset.publicPath.replace("bottles-v2", "bottles-v3") === image), `${id} ${colour} references an unmanifested final image: ${image}`);
    }
  }
}

const allDay = catalog.products.find((item) => item.id === "kalm-move-all-day-straw-tumbler");
assert(allDay.comingSoon === true && allDay.availability === "coming_soon", "All-Day Straw Tumbler must remain a coming-soon product.");
assert(allDay.price === null && allDay.compareAtPrice === null && allDay.trackInventory === false, "All-Day Straw Tumbler must not expose price or stock.");
assert(allDay.variants.every((variant) => variant.enabled === false && variant.availability === "coming_soon" && !("quantity" in variant)), "All-Day Straw Tumbler variants must be excluded from checkout.");

console.log(JSON.stringify({
  status: "passed",
  scopedProducts: bottleIds.length,
  copiedApprovedAssets: manifest.assetCount,
  allDayStrawTumbler: "coming_soon_not_purchasable"
}, null, 2));
