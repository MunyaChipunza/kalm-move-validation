import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const rel = (...parts) => resolve(root, ...parts);
const read = (path) => readFileSync(path, 'utf8');
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();
const pngDimensions = (path) => {
  const bytes = readFileSync(path);
  if (bytes.toString('ascii', 1, 4) !== 'PNG') throw new Error(`Not a PNG: ${path}`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};
const imageDimensions = (path) => path.toLowerCase().endsWith('.png') ? pngDimensions(path) : null;

const assets = {
  sourceFront: ['assets/images/review-only/ks-active/p050-racer-knit-bra/source-reference/espresso-front.png', 'BB9A33FB5A8FA8405EF26DE744DDEB85A853889E17DAA56A93E26BBB36C3E973'],
  sourceBack: ['assets/images/review-only/ks-active/p050-racer-knit-bra/source-reference/espresso-back.png', 'C911CEAD8881679FB31B31461125129E7672673A95E5646DD2A2133F4CC9C4AE'],
  hero: ['assets/images/review-only/ks-active/p050-racer-knit-bra/generated/espresso-hero-three-quarter.png', '085EF91A87EC79A3C2BEA3DF3C7A91C2C2A88EB4DAF5EE5C58168E3F8930D475'],
  back: ['assets/images/review-only/ks-active/p050-racer-knit-bra/generated/espresso-back.png', 'B94B1B27DB57FBAFABF95E1D9A2EAACC41E3BE3CA6B5B7102D0D23A7AB2EDEDC'],
  side: ['assets/images/review-only/ks-active/p050-racer-knit-bra/generated/espresso-side.png', 'E34FD2598204835C325BAE9EC833D5C88EBBB5609603C67D2254A66DEED90068'],
  front: ['assets/images/review-only/ks-active/p050-racer-knit-bra/generated/espresso-front.png', 'C659AF48949AD2F54E4DCDF61FAAF0315BCEA0C84B3F1A2B23D08494DF9D5A06'],
  sourcePlum: ['assets/images/review-only/ks-active/p050-racer-knit-bra/source-reference/plum-back.jpg', '0398296D93A7320CBD8507622A81337E4015591572D2F17B453AB5CF990E77A6'],
  plumHero: ['assets/images/review-only/ks-active/p050-racer-knit-bra/generated/plum-front-full.png', '099DEEBC7E60D622E153B3FFAE1D532BD3875E2FC46B7AC9008B1ED96DBD1DDA'],
  plumBack: ['assets/images/review-only/ks-active/p050-racer-knit-bra/generated/plum-back-full.png', '94642D6604B3B2F9375DEE8AFC817632A6ABB1E5C50416A2A3CEE24134EBBFF1'],
  plumSide: ['assets/images/review-only/ks-active/p050-racer-knit-bra/generated/plum-side-full.png', '7648842A65268B65EE9D29AF75A8AAAD87598DAFE8F17013BDCF8C1176A05CDB'],
  plumFront: ['assets/images/review-only/ks-active/p050-racer-knit-bra/generated/plum-front.png', '824C1B702FF6B83503D21B21171789C9682B77A605FF41ACBA37D7077D669C2A']
};

const failures = [];
const checks = {};
for (const [name, [relativePath, expectedHash]] of Object.entries(assets)) {
  const path = rel(relativePath);
  const present = existsSync(path);
  const hash = present ? sha256(path) : null;
  const dimensions = present ? imageDimensions(path) : null;
  checks[name] = { present, sha256Matches: hash === expectedHash, dimensions };
  if (!present || hash !== expectedHash) failures.push(`${name} missing or hash mismatch`);
}

const routePath = rel('review/ks-active/p050-racer-knit-bra/index.html');
const route = read(routePath);
checks.hiddenReviewRoute = {
  present: existsSync(routePath),
  noindex: route.includes('noindex, nofollow, noarchive, nosnippet'),
  sourceLabel: route.includes('SOURCE REFERENCE - NOT FOR PUBLICATION'),
  generatedLabel: route.includes('GENERATED MODEL REVIEW'),
  noPurchaseControls: !/(<form\b|<button\b|data-cart|href=["'][^"']*(checkout|cart|bag)[^"']*["'])/i.test(route)
};
if (!checks.hiddenReviewRoute.present || !checks.hiddenReviewRoute.noindex || !checks.hiddenReviewRoute.sourceLabel || !checks.hiddenReviewRoute.generatedLabel || !checks.hiddenReviewRoute.noPurchaseControls) {
  failures.push('review route isolation or labelling failure');
}

const publicFiles = ['products.json', 'index.html', 'script.js', 'sitemap.xml', 'robots.txt'];
checks.notInPublicSurfaces = Object.fromEntries(publicFiles.map((file) => {
  const content = read(rel(file));
  return [file, !content.includes('p050-racer-knit-bra') && !content.includes('review-only/ks-active')];
}));
for (const [file, pass] of Object.entries(checks.notInPublicSurfaces)) if (!pass) failures.push(`${file} exposes P050 review material`);

const reportFiles = [
  'REFERENCE-LOCK.md', 'STOCK-LOCK.md', 'NAME-PROPOSAL.md', 'SOURCE-MANIFEST.json',
  'GENERATION-AUDIT.json', 'REJECTED-OUTPUTS.md', 'SIDE-BY-SIDE-COMPARISON.jpg',
  'MOBILE-REVIEW.jpg', 'DESKTOP-REVIEW.jpg', 'PLUM-REVIEW.jpg', 'SOURCE-GAPS.md', 'VALIDATION.json', 'APPROVAL-STATUS.md'
];
checks.reviewPack = Object.fromEntries(reportFiles.map((file) => [file, existsSync(rel('reports/KS-ACTIVE-ARCHIVE/P050-RACER-KNIT-BRA', file))]));
for (const [file, pass] of Object.entries(checks.reviewPack)) if (!pass) failures.push(`missing review-pack file: ${file}`);

checks.noOtherProductGeneration = !existsSync(rel('assets/images/review-only/ks-active/p049-rib-contour-legging'));
if (!checks.noOtherProductGeneration) failures.push('P049 generation directory exists');

const result = { scope: 'P050 source-locked review only: Espresso approved; Plum review; remaining colours evidence-gated', pass: failures.length === 0, failures, checks };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
