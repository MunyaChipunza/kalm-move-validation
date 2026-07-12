import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const catalog = JSON.parse(read("products.json"));
const script = read("script.js");
const styles = read("styles.css");
const index = read("index.html");
const hero = "assets/images/recovered/brands-v1/kalm-move-brand-hero-lifestyle-v1.webp";

assert(catalog.meta.heroImage === hero, "Homepage hero must use the verified KALM Move lifestyle asset.");
assert(fs.existsSync(path.join(root, hero)), "Homepage hero asset is missing.");
const collectiveLogo = "assets/branding/kalm-collective/kalm-collective-logo.png";
assert(index.includes(`src="${collectiveLogo}"`), "Static homepage must use the approved KALM Collective image logo.");
assert(script.includes('class="hero-brand-logo"'), "Rendered homepage must use the KALM Collective logo.");
assert(!index.includes("<span>kalmcollective.co.za</span>"), "Utility strip must not show the domain.");

const approvedLogos = catalog.brands.map((brand) => brand.approvedLogo);
assert(new Set(approvedLogos).size === catalog.brands.length, "Each brand must retain a unique approved logo.");
for (const logo of approvedLogos) {
  assert(logo.startsWith("assets/branding/"), `Brand logo must use an approved local target: ${logo}`);
  assert(fs.existsSync(path.join(root, logo)), `Brand logo is missing: ${logo}`);
}

const brandRenderer = script.slice(script.indexOf("function renderBrands()"), script.indexOf("function renderBrand("));
assert(!brandRenderer.includes("<h2>${escapeHtml(brand.name)}</h2>"), "Brands page must not repeat brand names beneath logos.");
assert(!script.includes("renderPhotographyInProduction"), "Photography-in-production renderer must be removed.");
assert(!styles.includes("photography-placeholder"), "Photography placeholder styling must be removed.");
assert(styles.includes(".move-audience-card.visual > img") && styles.includes("object-fit: cover"), "Move audience images need explicit cover fitting.");

const bottleIds = new Set([
  "kalm-move-everyday-bottle",
  "kalm-move-slim-wellness-bottle",
  "kalm-move-studio-bottle"
]);
for (const product of catalog.products.filter((item) => bottleIds.has(item.id))) {
  assert(product.gallery?.length === 1 && product.gallery[0] === product.image, `${product.id} must use one default gallery image.`);
  for (const [colour, value] of Object.entries(product.variantImages || {})) {
    assert(value?.hero && value.gallery?.length === 1 && value.gallery[0] === value.hero, `${product.id} ${colour} must use one consistent gallery image.`);
  }
}

const outdoorComingSoon = catalog.products.filter((product) => product.brandId === "kalm-outdoor" && product.availability === "coming_soon");
assert(outdoorComingSoon.length === 9, "Expected nine quarantined KALM Outdoor accessories.");
for (const product of outdoorComingSoon) {
  assert(!product.image, `${product.id} must not restore an unapproved render.`);
  assert(product.publicationStatus === "draft" && product.visibility === "hidden", `${product.id} must stay hidden from public routes.`);
}
assert(!script.includes("renderPhotographyInProduction"), "Legacy Outdoor placeholder renderer must be absent.");
assert(!script.includes("<strong>Photography<br>in production</strong>"), "Outdoor cards must not render photography placeholder art.");

for (const source of [index, script, styles, JSON.stringify(catalog)]) {
  assert(!source.includes("G:\\My Drive"), "Public source must not expose a Drive path.");
}

console.log(JSON.stringify({
  status: "passed",
  brands: catalog.brands.length,
  bottles: bottleIds.size,
  hiddenOutdoorAccessories: outdoorComingSoon.length,
  homeHero: catalog.meta.heroImage
}, null, 2));
