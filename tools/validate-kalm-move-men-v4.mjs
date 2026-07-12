import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(read(relative).replace(/^\uFEFF/, ''));
const fail = message => { throw new Error(message); };
const sha256 = relative => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex').toUpperCase();

const catalog = readJson('products.json');
const manifest = readJson('reports/kalm-move-men-v4-active-manifest.json');
const productMap = readJson('reports/kalm-move-men-v3-product-map.json');
const responsive = readJson('reports/kalm-responsive-image-manifest.json');
const stage2BottleOverrides = new Set(['kalm-move-protein-shaker-bottle']);
const men = catalog.products.filter(product => product.brandId === 'kalm-move' && product.audience === 'men' && !stage2BottleOverrides.has(product.id));
if (men.length !== 10) fail(`Expected 10 non-bottle Men V4 products, found ${men.length}.`);
if (manifest.records.length !== 46 || productMap.records.length !== 46) fail('Men V4 records are incomplete.');
if (manifest.summary.activeV3Assets !== 46 || productMap.summary.approvedForV4Preview !== 46) fail('Men V4 approval counts do not equal the full audited set.');
if (productMap.records.some(record => record.selection !== 'approved_for_v4_preview')) fail('A V3 record lacks an explicit preview selection decision.');
if (responsive.records.length !== 92) fail('Expected 92 responsive derivatives for 46 Men V4 assets.');

const activeByPair = new Map(manifest.records
  .filter(record => !stage2BottleOverrides.has(record.productId))
  .map(record => [`${record.productId}::${record.colour}`, record]));
const sourceUse = new Map();
let productColourCount = 0;
for (const product of men) {
  if (/men-recovery-v2|men-embedded-logo-v3/i.test(JSON.stringify(product))) fail(`Old or staged Men image lane still referenced by ${product.id}.`);
  if (!product.mediaPresentation) fail(`${product.id} has no image-presentation metadata.`);
  for (const key of ['cardFit', 'cardPosition', 'mobileCardFit', 'mobileCardPosition', 'galleryFit', 'galleryPosition', 'background']) {
    if (!product.mediaPresentation[key]) fail(`${product.id} is missing mediaPresentation.${key}.`);
  }
  const colours = Object.keys(product.variantImages || {});
  if (!colours.length || new Set(product.colors || []).size !== colours.length) fail(`${product.id} has inconsistent public colours.`);
  for (const colour of colours) {
    productColourCount += 1;
    const record = activeByPair.get(`${product.id}::${colour}`);
    if (!record) fail(`No active manifest record for ${product.id} / ${colour}.`);
    const variant = product.variantImages[colour];
    const expected = record.activePath;
    if (variant.hero !== expected || variant.gallery.length !== 1 || variant.gallery[0] !== expected) fail(`${product.id} / ${colour} mixes non-V4 gallery paths.`);
    if (!expected.includes(`/men/${product.slug.replace(/^kalm-move-/, '')}-v4/`)) fail(`${product.id} / ${colour} is outside its V4 product directory.`);
    if (!fs.existsSync(path.join(root, expected))) fail(`Missing active V4 image: ${expected}`);
    if (sha256(expected) !== record.localHash || record.localHash !== record.sourceHash) fail(`Hash verification failed for ${expected}.`);
    const sources = product.responsiveImages?.card?.[colour] || [];
    if (sources.length !== 3 || !sources.every(source => fs.existsSync(path.join(root, source.path)))) fail(`${product.id} / ${colour} has incomplete responsive card sources.`);
    const prior = sourceUse.get(record.sourceHash);
    if (prior && prior !== `${product.id}::${colour}`) fail(`One Men V3 source is assigned to incompatible records: ${prior} and ${product.id}::${colour}.`);
    sourceUse.set(record.sourceHash, `${product.id}::${colour}`);
  }
}
if (productColourCount !== 42 || sourceUse.size !== 42) fail(`Expected 42 active Men V4 product-colour sources after the approved bottle override, found ${productColourCount} records / ${sourceUse.size} sources.`);

console.log(JSON.stringify({
  status: 'passed',
  menProducts: men.length,
  activeProductColours: productColourCount,
  historicalV3Assets: manifest.records.length,
  activeV3AssetsExcludingBottleOverride: productColourCount,
  responsiveDerivatives: responsive.records.length,
  uniqueV3SourceHashes: sourceUse.size
}, null, 2));
