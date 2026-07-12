import fs from "node:fs";

const catalogPath = new URL("../products.json", import.meta.url);
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

const approvedLogos = {
  "ks-active": "assets/branding/ks-active/ks-active-logo-transparent-mono.png",
  "kalm-move": "assets/branding/kalm-move/kalm-move-logo.png",
  "kalm-outdoor": "assets/branding/kalm-outdoor/kalm-outdoor-logo.png",
  "kalm-wellness": "assets/branding/kalm-wellness/kalm-wellness-logo.png",
  "kalm-home": "assets/branding/kalm-home/kalm-home-logo.png"
};

catalog.meta.logo = "assets/branding/kalm-collective/kalm-collective-logo.png";
catalog.meta.logoAlt = "KALM Collective logo";
delete catalog.meta.brandsPageMark;

for (const brand of catalog.brands) {
  const logo = approvedLogos[brand.id];
  if (!logo) continue;
  brand.logo = logo;
  brand.approvedLogo = logo;
}

const retainedBottleColours = new Map([
  ["kalm-move-everyday-bottle", ["Cream"]],
  ["kalm-move-slim-wellness-bottle", ["Matte White"]],
  ["kalm-move-studio-bottle", ["Stone"]]
]);

for (const product of catalog.products) {
  const retained = retainedBottleColours.get(product.id);
  if (retained) {
    const colour = retained[0];
    const media = product.variantImages[colour];
    product.colors = retained;
    product.variantImages = { [colour]: { hero: media.hero, gallery: [media.hero] } };
    product.image = media.hero;
    product.gallery = [media.hero];
    product.variants = product.variants.filter((variant) => retained.includes(variant.colour));
  }
}

const outdoorAccessoryIds = new Set([
  "kalm-outdoor-ember-launch-pro-perforated-peel",
  "kalm-outdoor-ember-turn-pro-turning-peel",
  "kalm-outdoor-ember-dough-and-heat-kit",
  "kalm-outdoor-ridge-smart-temperature-system",
  "kalm-outdoor-ridge-pro-rotisserie-kit",
  "kalm-outdoor-ridge-cast-iron-sear-system",
  "kalm-outdoor-forge-pro-griddle-tool-roll",
  "kalm-outdoor-forge-smash-and-steam-kit",
  "kalm-outdoor-forge-season-and-care-kit"
]);

for (const product of catalog.products) {
  if (!outdoorAccessoryIds.has(product.id)) continue;
  product.publicationStatus = "draft";
  product.visibility = "hidden";
}

catalog.meta.updated = "2026-07-12";
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
