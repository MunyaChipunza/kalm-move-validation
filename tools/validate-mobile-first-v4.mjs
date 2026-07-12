import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const fail = message => { throw new Error(message); };
const css = read('styles.css');
const js = read('script.js');
const catalog = JSON.parse(read('products.json').replace(/^\uFEFF/, ''));
const images = [];
for (const product of catalog.products.filter(product => product.publicationStatus !== 'draft' && product.visibility !== 'hidden')) {
  images.push(product.image, ...(product.gallery || []));
  for (const variant of Object.values(product.variantImages || {})) images.push(variant.hero, ...(variant.gallery || []));
}
for (const image of images.filter(Boolean)) {
  if (/^https?:|^data:/.test(image)) continue;
  const fullPath = path.join(root, image);
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) fail(`Public product image is missing or empty: ${image}`);
}
if (/object-fit\s*:\s*fill/i.test(css)) fail('object-fit: fill is prohibited.');
if (!css.includes('aspect-ratio: var(--card-aspect') || !css.includes('--mobile-card-position')) fail('Product-specific card presentation controls are missing.');
if (!css.includes('object-fit: var(--gallery-fit')) fail('Gallery fit metadata is not applied.');
if (!css.includes('@media (max-width: 359px)') || !css.includes('grid-template-columns: repeat(2, minmax(0, 1fr))')) fail('Required mobile one-column/two-column grid thresholds are missing.');
if (!css.includes('width: 100vw') || !/min-height:\s*(6[0-9]|7[0-9]|8[0-9])px/.test(css)) fail('Mobile shell width/header constraints are missing.');
if (!js.includes('setFilterSheetOpen') || !js.includes('aria-expanded')) fail('Mobile filter open/close state is not accessible.');
if (!js.includes('renderResponsiveCardAttributes') || !js.includes('srcset')) fail('Responsive card image delivery is not implemented.');
console.log(JSON.stringify({ status: 'passed', publicImagePathsChecked: images.filter(Boolean).length, viewportsRequired: [320, 360, 375, 390, 412, 430, 768, '844x390'] }, null, 2));
