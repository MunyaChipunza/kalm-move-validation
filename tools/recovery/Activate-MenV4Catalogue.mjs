import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const catalogPath = path.join(root, 'products.json');
const manifestPath = path.join(root, 'reports', 'kalm-move-men-v4-active-manifest.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8').replace(/^\uFEFF/, ''));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
const active = new Map(manifest.records.map(record => [`${record.productId}::${record.colour}`, record]));

catalog.meta.logo = 'assets/branding/kalm-collective/kalm-collective-logo.png';
catalog.meta.logoAlt = 'KALM Collective logo';

function presentationFor(product) {
  const title = product.title.toLowerCase();
  if (title.includes('cap')) return {
    cardFit: 'cover', cardPosition: '50% 30%', mobileCardFit: 'cover', mobileCardPosition: '50% 26%',
    cardAspectRatio: '4 / 5', mobileCardAspectRatio: '4 / 5', galleryFit: 'contain', galleryPosition: '50% 34%', background: '#f6f5f2'
  };
  if (title.includes('bottle') || title.includes('sock')) return {
    cardFit: 'contain', cardPosition: '50% 50%', mobileCardFit: 'contain', mobileCardPosition: '50% 50%',
    cardAspectRatio: '4 / 5', mobileCardAspectRatio: '4 / 5', galleryFit: 'contain', galleryPosition: '50% 50%', background: '#f6f5f2'
  };
  if (title.includes('bag')) return {
    cardFit: 'cover', cardPosition: '50% 45%', mobileCardFit: 'cover', mobileCardPosition: '50% 42%',
    cardAspectRatio: '4 / 5', mobileCardAspectRatio: '4 / 5', galleryFit: 'contain', galleryPosition: '50% 50%', background: '#f6f5f2'
  };
  return {
    cardFit: 'cover', cardPosition: '50% 42%', mobileCardFit: 'cover', mobileCardPosition: '50% 37%',
    cardAspectRatio: '4 / 5', mobileCardAspectRatio: '4 / 5', galleryFit: 'contain', galleryPosition: '50% 50%', background: '#f6f5f2'
  };
}

let changedProducts = 0;
let changedColours = 0;
for (const product of catalog.products) {
  if (product.brandId !== 'kalm-move' || product.audience !== 'men') continue;
  const colours = Object.keys(product.variantImages || {});
  const nextVariantImages = {};
  const responsiveCardImages = {};
  for (const colour of colours) {
    const record = active.get(`${product.id}::${colour}`);
    if (!record) throw new Error(`Missing V4 selection for ${product.id} / ${colour}`);
    nextVariantImages[colour] = { hero: record.activePath, gallery: [record.activePath] };
    responsiveCardImages[colour] = record.responsiveCardSources;
    changedColours += 1;
  }
  const defaultColour = colours[0];
  product.image = nextVariantImages[defaultColour].hero;
  product.gallery = [...nextVariantImages[defaultColour].gallery];
  product.variantImages = nextVariantImages;
  product.colors = colours;
  product.mediaPresentation = presentationFor(product);
  product.responsiveImages = { card: responsiveCardImages };
  product.tags = [...new Set([...(product.tags || []).filter(tag => tag !== 'men-image-trimmed'), 'men-v4-preview'])];
  product.updatedAt = '2026-07-12T10:00:00.000+02:00';
  product.updatedBy = 'kalm-mobile-first-v4';
  changedProducts += 1;
}

if (changedProducts !== 11 || changedColours !== 46) throw new Error(`Expected 11 products / 46 colours, got ${changedProducts} / ${changedColours}`);
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(JSON.stringify({ changedProducts, changedColours }, null, 2));
