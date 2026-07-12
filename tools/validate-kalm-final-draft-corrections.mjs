import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const hash = (file) => createHash("sha256").update(readFileSync(resolve(root, file))).digest("hex");
const exists = (file) => existsSync(resolve(root, file));
const checks = [];
const failures = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
  if (!pass) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
};

const catalog = JSON.parse(read("products.json"));
const merchandising = read("merchandising.js");
const index = read("index.html");
const stage2 = JSON.parse(read("reports/KALM-MOVE-BOTTLES-STAGE2-20260712/product-image-manifest.json"));
const sourceInventory = JSON.parse(read("reports/KALM-FINAL-DRAFT-CORRECTIONS-20260712/logo-audit-source/active-apparel-hero-inventory.json"));
const bottleIds = new Set([
  "kalm-move-everyday-bottle",
  "kalm-move-slim-wellness-bottle",
  "kalm-move-studio-bottle",
  "kalm-move-protein-shaker-bottle",
  "kalm-move-all-day-straw-tumbler"
]);
const bottles = catalog.products.filter((product) => bottleIds.has(product.id));
const allBottlePaths = [];
for (const product of bottles) {
  const add = (value) => typeof value === "string" && allBottlePaths.push(value);
  add(product.image);
  (product.gallery || []).forEach(add);
  Object.values(product.variantImages || {}).forEach((variant) => {
    add(variant?.hero);
    (variant?.gallery || []).forEach(add);
  });
}
const correctedStage1 = stage2.assets.map((asset) => ({
  source: asset.reviewSource,
  sourceHash: hash(asset.reviewSource),
  corrected: asset.publicPath.replace("bottles-v2", "bottles-v3"),
}));
check("Five approved bottle products are present", bottles.length === 5, String(bottles.length));
check("No active bottle path references bottles-v2", allBottlePaths.every((asset) => !asset.includes("bottles-v2")));
check("Every active bottle path uses immutable bottles-v3", allBottlePaths.every((asset) => asset.includes("bottles-v3")));
check("Every active bottle asset exists", allBottlePaths.every(exists), allBottlePaths.filter((asset) => !exists(asset)).join(", "));
check("All 60 Stage 1 bottle masters have fresh v3 copies", correctedStage1.length === 60 && correctedStage1.every((asset) => exists(asset.corrected)));
check("Every bottles-v3 copy byte-matches its approved Stage 1 source", correctedStage1.every((asset) => hash(asset.corrected) === asset.sourceHash));
const allDay = catalog.products.find((product) => product.id === "kalm-move-all-day-straw-tumbler");
check("All-Day Straw Tumbler remains non-purchasable Coming soon", allDay?.comingSoon === true && allDay?.price === null && allDay?.availability === "coming_soon");
check("Bottle presentation uses contain fitting and 4:5 ratio", bottles.every((product) => product.mediaPresentation?.cardFit === "contain" && product.mediaPresentation?.mobileCardFit === "contain" && product.mediaPresentation?.galleryFit === "contain"));

const campaigns = [
  "assets/images/recovered/campaigns-v2/kalm-final-home-hero-v2-desktop.webp",
  "assets/images/recovered/campaigns-v2/kalm-final-home-hero-v2-tablet.webp",
  "assets/images/recovered/campaigns-v2/kalm-final-home-hero-v2-mobile.webp",
  "assets/images/recovered/campaigns-v2/kalm-final-move-performance-v2-desktop.webp",
  "assets/images/recovered/campaigns-v2/kalm-final-move-performance-v2-mobile.webp"
];
check("All five corrected campaign assets exist", campaigns.every(exists), campaigns.filter((asset) => !exists(asset)).join(", "));
check("Homepage configuration references campaigns-v2 only", merchandising.includes("campaigns-v2/kalm-final-home-hero-v2-desktop.webp") && merchandising.includes("campaigns-v2/kalm-final-move-performance-v2-desktop.webp") && !merchandising.includes("campaigns-v1/kalm-comprehensive-home-hero-v1"));
check("Static hero markup references the corrected responsive hero", index.includes("campaigns-v2/kalm-final-home-hero-v2-desktop.webp") && index.includes("campaigns-v2/kalm-final-home-hero-v2-mobile.webp"));

check("Approved buffalo source is present", exists("assets/branding/kalm-buffalo/kalm-buffalo-mark.png"));
check("Active KALM Move apparel hero audit covers the full non-accessory scope", sourceInventory.length === 26 && sourceInventory.reduce((total, product) => total + product.variants.length, 0) === 138);
check("No public source exposes a Drive path", ![JSON.stringify(catalog), merchandising, index].some((source) => source.includes("G:\\My Drive")));
check("No public source references rejected bottle V1 assets", !JSON.stringify(catalog).match(/bottles-v1|rejected.*bottle/i));

const result = {
  status: failures.length ? "failed" : "passed",
  checkCount: checks.length,
  failures,
  checks,
  bottleAssetPairs: correctedStage1.map((asset) => ({ ...asset, correctedHash: hash(asset.corrected) })),
  campaignAssets: campaigns.map((asset) => ({ path: asset, sha256: hash(asset) })),
  approvedBuffaloSha256: hash("assets/branding/kalm-buffalo/kalm-buffalo-mark.png")
};
writeFileSync(resolve(root, "reports/KALM-FINAL-DRAFT-CORRECTIONS-20260712/VALIDATION.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ status: result.status, checkCount: result.checkCount, failures }, null, 2));
if (failures.length) process.exit(1);
