#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const walk = (directory) => fs.existsSync(directory)
  ? fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  })
  : [];
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").toUpperCase();

const catalog = JSON.parse(read("products.json"));
const index = read("index.html");
const script = read("script.js");
const styles = read("styles.css");
const denylist = JSON.parse(read("reports/KALM-DRAFT-REJECTION-20260712/rejected-asset-denylist.json"));
const expectedLogos = {
  "ks-active": "assets/branding/ks-active/ks-active-logo-transparent-mono.png",
  "kalm-move": "assets/branding/kalm-move/kalm-move-logo.png",
  "kalm-outdoor": "assets/branding/kalm-outdoor/kalm-outdoor-logo.png",
  "kalm-wellness": "assets/branding/kalm-wellness/kalm-wellness-logo.png",
  "kalm-home": "assets/branding/kalm-home/kalm-home-logo.png"
};
const collectiveLogo = "assets/branding/kalm-collective/kalm-collective-logo.png";

for (const asset of denylist.assets) {
  assert(!fs.existsSync(path.join(root, asset.path)), `Rejected asset remains present: ${asset.path}`);
  assert(![catalog, index, script, styles].some((value) => JSON.stringify(value).includes(asset.path)), `Rejected asset remains referenced by active storefront source: ${asset.path}`);
}

const deniedHashes = new Set(denylist.assets.map((asset) => asset.sha256).filter(Boolean));
for (const file of [...walk(path.join(root, "assets")), ...walk(path.join(root, "branding"))]) {
  assert(!deniedHashes.has(sha256(file)), `Rejected asset hash remains in an active asset folder: ${path.relative(root, file)}`);
}

assert(catalog.meta.logo === collectiveLogo, "KALM Collective metadata must use the approved image logo.");
assert(catalog.meta.favicon === collectiveLogo && catalog.meta.socialPreview === collectiveLogo, "Favicon and social metadata must use the approved image logo.");
assert(index.includes(`src="${collectiveLogo}"`), "Static desktop/mobile header must use the approved KALM Collective image logo.");
assert(script.includes('class="hero-brand-logo"') && script.includes('renderFooter()'), "Homepage hero and footer must render the KALM Collective image logo.");
assert(!index.includes("KALM\nCOLLECTIVE") && !index.includes("<span>KALM</span>"), "Typed text must not replace the visible KALM Collective logo.");

const logoPaths = [];
for (const brand of catalog.brands) {
  assert(brand.logo === expectedLogos[brand.id], `${brand.id} must use its exact verified logo target.`);
  assert(brand.approvedLogo === expectedLogos[brand.id], `${brand.id} must retain its exact verified approvedLogo target.`);
  logoPaths.push(brand.logo);
}
assert(new Set(logoPaths).size === catalog.brands.length, "No two brands may share a logo path.");
assert(!JSON.stringify(catalog).includes("brandsPageMark"), "The generic Brands-page buffalo override must be absent.");

const bottleRules = new Map([
  ["kalm-move-everyday-bottle", ["Black", "Cream", "Lilac", "Sky Blue"]],
  ["kalm-move-slim-wellness-bottle", ["Matte White", "Stone", "Soft Pink", "Sage"]],
  ["kalm-move-studio-bottle", ["Black", "Stone", "Lilac", "Sky Blue"]],
  ["kalm-move-protein-shaker-bottle", ["Black", "Charcoal", "Navy", "Smoke Grey"]],
  ["kalm-move-all-day-straw-tumbler", ["Black", "Cream", "Lilac", "Sky Blue"]]
]);
for (const product of catalog.products.filter((item) => bottleRules.has(item.id))) {
  const expectedColours = bottleRules.get(product.id);
  assert(JSON.stringify(product.colors) === JSON.stringify(expectedColours), `${product.id} has unsupported public bottle colours.`);
  assert(product.image.startsWith("assets/images/products/kalm-move/bottles-v4/"), `${product.id} must use fresh V4 bottle imagery.`);
  assert(product.gallery.length === 2 && product.gallery[0] === product.image, `${product.id} must have a front and alternate default gallery.`);
  for (const [colour, images] of Object.entries(product.variantImages)) {
    assert(expectedColours.includes(colour), `${product.id} exposes an unsupported colour.`);
    assert(images.hero.startsWith("assets/images/products/kalm-move/bottles-v4/"), `${product.id} ${colour} must use fresh V4 bottle imagery.`);
    assert(images.gallery.length === 2 && images.gallery[0] === images.hero, `${product.id} ${colour} must have a front and alternate gallery.`);
    assert(new Set(images.gallery).size === 2, `${product.id} ${colour} gallery must contain distinct approved views.`);
  }
}
assert(catalog.products.filter((item) => bottleRules.has(item.id)).length === 5, "Exactly five Stage 2 bottle products must be public.");
const allDay = catalog.products.find((item) => item.id === "kalm-move-all-day-straw-tumbler");
assert(allDay?.comingSoon && allDay?.availability === "coming_soon", "All-Day Straw Tumbler must remain coming soon.");
assert(allDay?.price === null && allDay?.compareAtPrice === null, "All-Day Straw Tumbler must not expose a price.");
assert(allDay?.trackInventory === false && allDay?.inventoryPolicy === "deny", "All-Day Straw Tumbler must not expose inventory.");
assert(allDay?.comingSoonCallToAction === false, "All-Day Straw Tumbler must not expose a waitlist or purchase CTA.");
assert(allDay?.variants?.every((variant) => variant.enabled === false && variant.availability === "coming_soon" && !("quantity" in variant)), "All-Day Straw Tumbler variants must be disabled and stockless.");
assert(script.includes("function productMatchesAudience") && script.includes("product.comingSoonCallToAction !== false"), "Bottle audience support and coming-soon purchase guard are required.");
const galleryRenderer = script.slice(script.indexOf("function renderProductGallery"), script.indexOf("function renderGallerySlides"));
assert(galleryRenderer.includes('count > 1 ? `<span class="gallery-count"'), "Single-image galleries must not render a counter.");

const accessoryIds = [
  "kalm-outdoor-ember-launch-pro-perforated-peel",
  "kalm-outdoor-ember-turn-pro-turning-peel",
  "kalm-outdoor-ember-dough-and-heat-kit",
  "kalm-outdoor-ridge-smart-temperature-system",
  "kalm-outdoor-ridge-pro-rotisserie-kit",
  "kalm-outdoor-ridge-cast-iron-sear-system",
  "kalm-outdoor-forge-pro-griddle-tool-roll",
  "kalm-outdoor-forge-smash-and-steam-kit",
  "kalm-outdoor-forge-season-and-care-kit"
];
for (const id of accessoryIds) {
  const product = catalog.products.find((item) => item.id === id);
  assert(product?.publicationStatus === "draft" && product?.visibility === "hidden", `${id} must not be public.`);
}
const outdoorRenderer = script.slice(script.indexOf("function renderKalmOutdoorExperience"), script.indexOf("function getOutdoorWaitlistChoices"));
for (const text of ["Nine accessories in development.", "Photography in production", "Build your open-air cooking routine.", "View all coming soon", "Join the accessory waitlist", "No illustrative product renders are shown in this preview."]) {
  assert(!outdoorRenderer.includes(text), `Rejected Outdoor content returned: ${text}`);
}
assert(outdoorRenderer.includes("outdoor-collection-intro") && outdoorRenderer.includes("product-grid"), "Outdoor must render the image-led appliance collection.");

for (const source of [index, script, styles, JSON.stringify(catalog)]) {
  assert(!source.includes("G:\\My Drive"), "A Drive path is exposed by public storefront source.");
}
assert(!fs.readdirSync(root).some((entry) => entry.includes("production")), "A production-deploy artifact must not be created in the workspace.");

console.log(JSON.stringify({
  status: "passed",
  deletedAssetPathsValidated: denylist.assets.length,
  approvedBrandLogos: logoPaths.length,
  hiddenOutdoorAccessories: accessoryIds.length,
  productionDeployment: "not requested or invoked"
}, null, 2));
