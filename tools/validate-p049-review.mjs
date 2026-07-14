import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rel = (...parts) => resolve(process.cwd(), ...parts);
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();
const reportDir = 'reports/KS-ACTIVE-ARCHIVE/P049-RIB-CONTOUR-LEGGING';
const base = 'assets/images/review-only/ks-active/p049-rib-contour-legging';
const colours = ['Bright Green', 'White', 'Peach Yellow', 'Egyptian Blue', 'Gray', 'Red'];
const slugs = ['bright-green', 'white', 'peach-yellow', 'egyptian-blue', 'gray', 'red'];
const views = ['hero-three-quarter', 'back', 'side', 'front'];
const failures = [];
const checks = {};
const fail = (label, condition) => { if (!condition) failures.push(label); return condition; };

const sourcePath = rel(base, 'source-reference', 'supplier-main.jpg');
checks.sourceHash = existsSync(sourcePath) && sha256(sourcePath) === '94E861F940883B9B853351CCD4F8047E1F27CC19B528FC87F29A9BE716931EF9';
fail('unaltered supplier source hash', checks.sourceHash);

const manifestPath = rel(reportDir, 'P049-COMPLETE-ASSET-MANIFEST.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
checks.manifest = {
  present: Boolean(manifest),
  status: manifest?.status === 'complete_stocked_colour_review_awaiting_final_munya_approval',
  stockTotal: manifest?.totalPhysicalUnits === 7,
  sixColours: Array.isArray(manifest?.confirmedStock) && manifest.confirmedStock.length === 6 && manifest.confirmedStock.every((entry, index) => entry.colour === colours[index]),
  noIntegration: manifest?.storefrontIntegration === false && manifest?.zohoUpdated === false && manifest?.intranetUpdated === false && manifest?.productionDeployed === false
};
for (const [name, passed] of Object.entries(checks.manifest)) fail(`manifest ${name}`, passed);

const generated = manifest?.assets?.filter((asset) => asset.role === 'generated_model_review') ?? [];
checks.acceptedAssets = {
  count: generated.length === 24,
  fourPerColour: colours.every((colour) => generated.filter((asset) => asset.colour === colour).length === 4),
  exactViews: colours.every((colour) => generated.filter((asset) => asset.colour === colour).map((asset) => asset.view).sort().join(',') === 'back,front,hero_three_quarter,side'),
  hashesAndDimensions: generated.every((asset) => {
    const path = rel(asset.path);
    return existsSync(path) && sha256(path) === asset.sha256 && asset.dimensions.width >= 1000 && asset.dimensions.height >= 1400;
  })
};
for (const [name, passed] of Object.entries(checks.acceptedAssets)) fail(`accepted assets ${name}`, passed);

const routePath = rel('review/ks-active/p049-rib-contour-legging/index.html');
const route = existsSync(routePath) ? readFileSync(routePath, 'utf8') : '';
const sections = route.split('<section class="colour"').slice(1);
checks.hiddenReviewRoute = {
  present: existsSync(routePath),
  noindex: route.includes('noindex, nofollow, noarchive, nosnippet'),
  allColours: colours.every((colour) => route.includes(`>${colour} ·`)),
  sixSourceFirstSections: sections.length === 6 && sections.every((section, index) => {
    const slug = slugs[index];
    const firstSource = section.indexOf('source-reference/supplier-main.jpg');
    const hero = section.indexOf(`generated/${slug}-hero-three-quarter.png`);
    return firstSource >= 0 && hero >= 0 && firstSource < hero;
  }),
  sourceLabels: (route.match(/SOURCE REFERENCE - NOT FOR PUBLICATION/g) ?? []).length >= 6,
  generatedLabels: (route.match(/GENERATED MODEL REVIEW/g) ?? []).length >= 24,
  stockEvidence: route.includes('7 PHYSICAL UNITS') && route.includes('In stock · 2') && (route.match(/Out of stock/g) ?? []).length >= 12,
  noPurchaseControls: !/(<form\b|<button\b|data-cart|href=["'][^"']*(checkout|cart|bag)[^"']*["'])/i.test(route)
};
for (const [name, passed] of Object.entries(checks.hiddenReviewRoute)) fail(`route ${name}`, passed);

const rejectedNames = ['bright-green-hero-three-quarter.png', 'bright-green-back.png', 'bright-green-side-same-model.png', 'egyptian-blue-muted-first-attempt.png'];
checks.rejectedAssets = {
  quarantined: rejectedNames.every((file) => existsSync(rel(reportDir, 'rejected-generated-v1', file))),
  neverRouted: rejectedNames.every((file) => !route.includes(`rejected-generated-v1/${file}`))
};
for (const [name, passed] of Object.entries(checks.rejectedAssets)) fail(`rejected asset ${name}`, passed);

const required = [
  'REFERENCE-LOCK.md', 'STOCK-LOCK.md', 'NAME-PROPOSAL.md', 'SOURCE-MANIFEST.json', 'GENERATION-AUDIT.json',
  'REJECTED-OUTPUTS.md', 'SIDE-BY-SIDE-COMPARISON.jpg', 'MOBILE-REVIEW.jpg', 'DESKTOP-REVIEW.jpg',
  'P049-MOBILE-COMPLETE-REVIEW.jpg', 'COMPLETE-P049-REVIEW.jpg', 'P049-COMPLETE-ASSET-MANIFEST.json',
  'FULL-P049-REVIEW.md', 'VALIDATION.json', 'APPROVAL-STATUS.md', 'DRAFT-DEPLOY.md',
  ...slugs.map((slug) => `${slug.toUpperCase()}-REVIEW.jpg`)
];
checks.reviewPack = Object.fromEntries(required.map((file) => [file, existsSync(rel(reportDir, file))]));
for (const [name, passed] of Object.entries(checks.reviewPack)) fail(`report ${name}`, passed);

checks.notPublic = Object.fromEntries(['products.json', 'index.html', 'script.js', 'sitemap.xml', 'robots.txt'].map((file) => [file, !readFileSync(rel(file), 'utf8').includes('p049-rib-contour-legging')]));
for (const [name, passed] of Object.entries(checks.notPublic)) fail(`public surface ${name}`, passed);

const result = { scope: 'P049 complete six-colour, source-first, hidden review', pass: failures.length === 0, failures, checks };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
