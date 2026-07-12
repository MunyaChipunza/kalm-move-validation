import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const WOMEN_SOURCE_COMMIT = "07258b3a6f2960718750a78b57a01f9537d4ce34";
const MEN_SOURCE_COMMIT = "5c0fff2da19269ff0f4ddd769c100d680c2b5f45";
const BOTTLE_SOURCE_COMMIT = "5d33e4b415ee0834a08d5cc7cbcebdd3bfa5d5ee";
const MEN_SOURCE_PATH = "assets/images/products/kalm-move/men/";
const MEN_RECOVERY_PATH = "assets/images/products/kalm-move/men-recovery-v2/";
const BOTTLE_SOURCE_PATH = "assets/images/products/kalm-move/women/studio-bottle/";
const BOTTLE_RECOVERY_PATH = "assets/images/products/kalm-move/women/studio-bottle-recovery-v2/";
const VISUAL_FIELDS = ["image", "gallery", "variantImages"];

function readCatalog(revision) {
  if (revision === "HEAD") return JSON.parse(readFileSync("products.json", "utf8"));
  const raw = execFileSync("git.exe", ["show", `${revision}:products.json`], { encoding: "utf8" });
  return JSON.parse(raw);
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function replacePaths(value, from, to) {
  if (typeof value === "string") return value.replaceAll(from, to);
  if (Array.isArray(value)) return value.map((item) => replacePaths(item, from, to));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replacePaths(item, from, to)]));
  }
  return value;
}

function replaceVisualFields(target, source, pathFrom, pathTo) {
  for (const field of VISUAL_FIELDS) {
    if (source[field] === undefined) delete target[field];
    else target[field] = replacePaths(clone(source[field]), pathFrom, pathTo);
  }
}

const catalog = readCatalog("HEAD");
const womenSource = readCatalog(WOMEN_SOURCE_COMMIT);
const menSource = readCatalog(MEN_SOURCE_COMMIT);
const bottleSource = readCatalog(BOTTLE_SOURCE_COMMIT);
const womenById = new Map(womenSource.products.map((product) => [product.id, product]));
const menById = new Map(menSource.products.map((product) => [product.id, product]));
const bottlesById = new Map(bottleSource.products.map((product) => [product.id, product]));

const recoveredWomen = [];
const recoveredMen = [];
const removedOutdoorReferences = [];

for (const product of catalog.products) {
  const currentVisuals = JSON.stringify(Object.fromEntries(VISUAL_FIELDS.map((field) => [field, product[field]])));
  const womenSourceProduct = womenById.get(product.id);
  if (product.brandId === "kalm-move" && product.audience === "women" && womenSourceProduct && currentVisuals.includes("-v3/")) {
    replaceVisualFields(product, womenSourceProduct);
    recoveredWomen.push(product.id);
  }

  const menSourceProduct = menById.get(product.id);
  if (product.brandId === "kalm-move" && menSourceProduct && JSON.stringify(menSourceProduct).includes(MEN_SOURCE_PATH)) {
    replaceVisualFields(product, menSourceProduct, MEN_SOURCE_PATH, MEN_RECOVERY_PATH);
    recoveredMen.push(product.id);
  }

  if (product.id === "kalm-move-studio-bottle") {
    const bottleSourceProduct = bottlesById.get(product.id);
    if (!bottleSourceProduct) throw new Error("Studio Bottle source record is missing from the clean source commit.");
    replaceVisualFields(product, bottleSourceProduct, BOTTLE_SOURCE_PATH, BOTTLE_RECOVERY_PATH);
  }

  if (product.brandId === "kalm-outdoor" && product.comingSoon) {
    delete product.image;
    delete product.gallery;
    delete product.variantImages;
    delete product.conceptImageDisclosure;
    product.photographyStatus = "Photography in production. Product images will be published after supplier approval.";
    removedOutdoorReferences.push(product.id);
  }
}

const moveBrand = catalog.brands.find((brand) => brand.id === "kalm-move");
if (moveBrand) {
  moveBrand.heroImage = "assets/images/campaign-hero.webp";
  moveBrand.tileImage = "assets/images/full-outfit-lifestyle-shop.webp";
}
const outdoorBrand = catalog.brands.find((brand) => brand.id === "kalm-outdoor");
if (outdoorBrand) {
  outdoorBrand.visualMode = "text-led";
  outdoorBrand.heroImage = "";
  outdoorBrand.tileImage = "";
}

writeFileSync("products.json", `${JSON.stringify(catalog, null, 2)}\n`);
writeFileSync("reports/visual-recovery-source-audit.json", `${JSON.stringify({
  generatedFor: "preview-only visual recovery",
  sourceCommits: {
    women: WOMEN_SOURCE_COMMIT,
    men: MEN_SOURCE_COMMIT,
    studioBottle: BOTTLE_SOURCE_COMMIT
  },
  cacheBustingPaths: {
    men: MEN_RECOVERY_PATH,
    studioBottle: BOTTLE_RECOVERY_PATH
  },
  recoveredWomen,
  recoveredMen,
  removedOutdoorReferences,
  recoveredBrandLifestyleAssets: {
    kalmMove: ["assets/images/campaign-hero.webp", "assets/images/full-outfit-lifestyle-shop.webp"],
    kalmOutdoor: []
  },
  unresolvedApprovedLifestyleAssets: [
    "No approved KALM Move man-and-woman natural-movement image was found in Git history, branches, LFS, reports, backups, or unreachable commits.",
    "No approved KALM Outdoor adults-at-a-premium-gathering image was found in Git history, branches, LFS, reports, backups, or unreachable commits."
  ]
}, null, 2)}\n`);

console.log(JSON.stringify({ recoveredWomen, recoveredMen, removedOutdoorReferences }, null, 2));
