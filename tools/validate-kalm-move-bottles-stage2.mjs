import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const catalog = readJson("products.json");
const manifest = readJson("reports/KALM-HERO-BOTTLE-REBUILD-AND-RELEASE-20260712/final-asset-manifest.json");
const bottleIds = [
  "kalm-move-everyday-bottle", "kalm-move-slim-wellness-bottle", "kalm-move-studio-bottle",
  "kalm-move-protein-shaker-bottle", "kalm-move-all-day-straw-tumbler"
];
const publicBottleAssets = manifest.assets.filter((asset) => asset.path.includes("/bottles-v4/"));

assert(publicBottleAssets.length === 40, "V4 manifest must contain exactly 40 accepted front/angle bottle assets.");
for (const asset of publicBottleAssets) {
  assert(asset.path.startsWith("assets/images/products/kalm-move/bottles-v4/"), `Non-V4 public path: ${asset.path}`);
  assert(asset.path.endsWith(".webp"), `V4 asset is not WebP: ${asset.path}`);
  assert(asset.dimensions[0] >= 1122 && asset.dimensions[1] >= 1402, `V4 asset below required native dimensions: ${asset.path}`);
  assert(fs.existsSync(path.join(root, asset.path)), `Missing V4 public asset: ${asset.path}`);
}

for (const id of bottleIds) {
  const product = catalog.products.find((item) => item.id === id);
  assert(product, `Missing scoped bottle product: ${id}`);
  assert(product.publicationStatus === "published" && product.visibility === "visible", `${id} must be visibly published.`);
  assert(product.colors.length === 4, `${id} must retain exactly four approved colours.`);
  assert(product.image.startsWith("assets/images/products/kalm-move/bottles-v4/"), `${id} does not use V4 imagery.`);
  assert(!JSON.stringify(product).match(/bottles-v[23]/), `${id} retains a rejected V2/V3 reference.`);
  for (const colour of product.colors) {
    const imageSet = product.variantImages?.[colour];
    assert(imageSet?.hero?.includes("bottles-v4"), `${id} ${colour} hero is not V4.`);
    assert(imageSet?.gallery?.length === 2, `${id} ${colour} must expose exactly a sharp front and alternate view.`);
    assert(imageSet.gallery.every((image) => image.includes("bottles-v4") && image.endsWith(".webp")), `${id} ${colour} gallery has a non-V4/non-WebP image.`);
    assert(imageSet.gallery[0] === imageSet.hero, `${id} ${colour} gallery must reset to its selected-colour hero.`);
  }
}

const allDay = catalog.products.find((item) => item.id === "kalm-move-all-day-straw-tumbler");
assert(allDay.comingSoon === true && allDay.availability === "coming_soon", "All-Day Straw Tumbler must remain a coming-soon product.");
assert(allDay.price === null && allDay.compareAtPrice === null && allDay.trackInventory === false, "All-Day Straw Tumbler must not expose price or stock.");
assert(allDay.variants.every((variant) => variant.enabled === false && variant.availability === "coming_soon" && !("quantity" in variant)), "All-Day Straw Tumbler variants must be excluded from checkout.");

console.log(JSON.stringify({
  status: "passed", scopedProducts: bottleIds.length, v4Assets: publicBottleAssets.length,
  allDayStrawTumbler: "coming_soon_not_purchasable"
}, null, 2));
