import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rel = (...parts) => resolve(process.cwd(), ...parts);
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();
const base = 'assets/images/review-only/ks-active/p049-rib-contour-legging';
const expected = {
  source: [`${base}/source-reference/supplier-main.jpg`, '94E861F940883B9B853351CCD4F8047E1F27CC19B528FC87F29A9BE716931EF9'],
  hero: [`${base}/generated/white-hero-three-quarter.png`, '363BF8C84B3D9DC863B7C7E628945E710EE3330B93DBAF8A8DEF495428DA49FD'],
  back: [`${base}/generated/white-back.png`, '96627C69DEED75903280062269787E4B9B7F7D88D27CD43F18DB82C769647E12'],
  side: [`${base}/generated/white-side.png`, '1DC09AF5FA3E1EEB6D349DAD63B7FF8470649A344554DE35E9C1FECB4BE30C81'],
  front: [`${base}/generated/white-front.png`, '16A4E73CD053701395D9A8CDDCC18754B8789CA9472C541D112820656AB70AB4']
};
const failures = [];
const checks = {};
checks.assetHashes = Object.fromEntries(Object.entries(expected).map(([name, [relativePath, expectedHash]]) => {
  const path = rel(relativePath);
  return [name, existsSync(path) && sha256(path) === expectedHash];
}));
for (const [name, passed] of Object.entries(checks.assetHashes)) if (!passed) failures.push(`asset ${name}`);

const routePath = rel('review/ks-active/p049-rib-contour-legging/index.html');
const route = existsSync(routePath) ? readFileSync(routePath, 'utf8') : '';
checks.hiddenReviewRoute = {
  present: existsSync(routePath),
  noindex: route.includes('noindex, nofollow, noarchive, nosnippet'),
  sourceBeforeGenerated: route.indexOf('supplier-main.jpg') >= 0 && route.indexOf('supplier-main.jpg') < route.indexOf('white-hero-three-quarter.png'),
  sourceLabel: route.includes('SOURCE REFERENCE - NOT FOR PUBLICATION'),
  generatedLabel: route.includes('GENERATED MODEL REVIEW'),
  whiteOnly: !/(Bright Green|Peach Yellow|Egyptian Blue|\bGray\b|\bRed\b)/.test(route),
  noPurchaseControls: !/(<form\b|<button\b|data-cart|href=["'][^"']*(checkout|cart|bag)[^"']*["'])/i.test(route)
};
for (const [name, passed] of Object.entries(checks.hiddenReviewRoute)) if (!passed) failures.push(`route ${name}`);

const reportDir = 'reports/KS-ACTIVE-ARCHIVE/P049-RIB-CONTOUR-LEGGING';
const required = ['REFERENCE-LOCK.md', 'STOCK-LOCK.md', 'NAME-PROPOSAL.md', 'SOURCE-MANIFEST.json', 'GENERATION-AUDIT.json', 'REJECTED-OUTPUTS.md', 'SIDE-BY-SIDE-COMPARISON.jpg', 'MOBILE-REVIEW.jpg', 'DESKTOP-REVIEW.jpg', 'VALIDATION.json', 'APPROVAL-STATUS.md', 'DRAFT-DEPLOY.md'];
checks.reviewPack = Object.fromEntries(required.map((file) => [file, existsSync(rel(reportDir, file))]));
for (const [name, passed] of Object.entries(checks.reviewPack)) if (!passed) failures.push(`report ${name}`);

checks.notPublic = Object.fromEntries(['products.json', 'index.html', 'script.js', 'sitemap.xml', 'robots.txt'].map((file) => [file, !readFileSync(rel(file), 'utf8').includes('p049-rib-contour-legging')]));
for (const [name, passed] of Object.entries(checks.notPublic)) if (!passed) failures.push(`public surface ${name}`);
const result = { scope: 'P049 White / M representative review only', pass: failures.length === 0, failures, checks };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
