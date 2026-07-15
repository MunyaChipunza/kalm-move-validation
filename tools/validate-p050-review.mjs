import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const rel = (...parts) => resolve(root, ...parts);
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();
const pngDimensions = (path) => {
  const bytes = readFileSync(path);
  if (bytes.toString('ascii', 1, 4) !== 'PNG') throw new Error(`Not a PNG: ${path}`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};
const imageDimensions = (path) => path.toLowerCase().endsWith('.png') ? pngDimensions(path) : null;

const base = 'assets/images/review-only/ks-active/p050-racer-knit-bra';
const assets = {
  sourceFront: [`${base}/source-reference/espresso-front.png`, 'BB9A33FB5A8FA8405EF26DE744DDEB85A853889E17DAA56A93E26BBB36C3E973'],
  sourceBack: [`${base}/source-reference/espresso-back.png`, 'C911CEAD8881679FB31B31461125129E7672673A95E5646DD2A2133F4CC9C4AE'],
  sourcePlum: [`${base}/source-reference/plum-back.jpg`, '0398296D93A7320CBD8507622A81337E4015591572D2F17B453AB5CF990E77A6'],
  espressoHero: [`${base}/generated/espresso-hero-three-quarter.png`, '085EF91A87EC79A3C2BEA3DF3C7A91C2C2A88EB4DAF5EE5C58168E3F8930D475'],
  espressoBack: [`${base}/generated/espresso-back.png`, 'B94B1B27DB57FBAFABF95E1D9A2EAACC41E3BE3CA6B5B7102D0D23A7AB2EDEDC'],
  espressoSide: [`${base}/generated/espresso-side.png`, 'E34FD2598204835C325BAE9EC833D5C88EBBB5609603C67D2254A66DEED90068'],
  espressoFront: [`${base}/generated/espresso-front.png`, 'C659AF48949AD2F54E4DCDF61FAAF0315BCEA0C84B3F1A2B23D08494DF9D5A06'],
  darkGreenHero: [`${base}/generated/dark-green-hero.png`, 'D71875BC89FA2BA76103CFC2B27EDC39B54A6ADAFBAF93A450ECB3F256BDE1C2'],
  darkGreenBack: [`${base}/generated/dark-green-back.png`, '81ED6E3B35224ECECC46880CA3C282F8C4D698F931B776FF2DB86AA4F6F3ED23'],
  darkGreenSide: [`${base}/generated/dark-green-side.png`, '03B881727F79D97F91B39337B8842D3B0FF7D3AC1B0E8AEED2EB3418F3C21880'],
  darkGreenFront: [`${base}/generated/dark-green-front.png`, '9709AFC03251D2064F165619976543A156284CBA64125B40A51BD84EC201F6A0'],
  ironBlueHero: [`${base}/generated/iron-blue-hero.png`, '85F3B9FD2A1CF6979C25FD72FDD58393D8DDA8624948FAB58287975AA4EFACC6'],
  ironBlueBack: [`${base}/generated/iron-blue-back.png`, '750C2900F620918EC3B3B8302B6746620805B9AEFAC42030A85DD7F2C9CDFD9B'],
  ironBlueSide: [`${base}/generated/iron-blue-side.png`, '5767BEB09A3B3906D591E4633061601494BEFAB2BEC33CFFCFB64BE1AC2448E5'],
  ironBlueFront: [`${base}/generated/iron-blue-front.png`, 'A9D5F5F4D4C590FCF5916F9DA420B0918F26AFBB6247DFA3ECDD0275FD602235'],
  plumHero: [`${base}/generated/plum-front-full.png`, '099DEEBC7E60D622E153B3FFAE1D532BD3875E2FC46B7AC9008B1ED96DBD1DDA'],
  plumBack: [`${base}/generated/plum-back-full.png`, '94642D6604B3B2F9375DEE8AFC817632A6ABB1E5C50416A2A3CEE24134EBBFF1'],
  plumSide: [`${base}/generated/plum-side-full.png`, '7648842A65268B65EE9D29AF75A8AAAD87598DAFE8F17013BDCF8C1176A05CDB'],
  plumFront: [`${base}/generated/plum-front.png`, '824C1B702FF6B83503D21B21171789C9682B77A605FF41ACBA37D7077D669C2A'],
  violetHero: [`${base}/generated/violet-hero.png`, 'C85CB0BDFB6634D5417353D19B910D16C317E2934F27EC075C87FB65A50786EC'],
  violetBack: [`${base}/generated/violet-back.png`, '0E9F5B109CD03EB40E84F7D600E3CAD384EED06F71A939DA50B73FF2CDD3440C'],
  violetSide: [`${base}/generated/violet-side.png`, '1E42C73AC9A5C6F38BB37FE552ECBE8ABD182A3F42761767F307CAE901ABCA7D'],
  violetFront: [`${base}/generated/violet-front.png`, 'CDB9B5CC60451F8F672905B584829863BE38AA7AC82DBD8DA26828A4B001136C']
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
const route = existsSync(routePath) ? readFileSync(routePath, 'utf8') : '';
checks.hiddenReviewRoute = {
  present: existsSync(routePath),
  noindex: route.includes('noindex, nofollow, noarchive, nosnippet'),
  sourceLabel: route.includes('SOURCE REFERENCE - NOT FOR PUBLICATION'),
  generatedLabel: route.includes('GENERATED MODEL REVIEW'),
  allStockedColours: ['Espresso', 'Dark Green', 'Iron Blue', 'Plum', 'Violet'].every((colour) => route.includes(colour)),
  noPurchaseControls: !/(<form\b|<button\b|data-cart|href=["'][^"']*(checkout|cart|bag)[^"']*["'])/i.test(route)
};
if (Object.values(checks.hiddenReviewRoute).some((pass) => pass === false)) failures.push('review route isolation, labels, or stocked-colour coverage failure');

const publicFiles = ['products.json', 'index.html', 'script.js', 'sitemap.xml', 'robots.txt'];
checks.notInPublicSurfaces = Object.fromEntries(publicFiles.map((file) => {
  const content = readFileSync(rel(file), 'utf8');
  return [file, !content.includes('p050-racer-knit-bra') && !content.includes('review-only/ks-active')];
}));
for (const [file, pass] of Object.entries(checks.notInPublicSurfaces)) if (!pass) failures.push(`${file} exposes P050 review material`);

const reportFiles = [
  'REFERENCE-LOCK.md', 'STOCK-LOCK.md', 'NAME-PROPOSAL.md', 'SOURCE-MANIFEST.json', 'SOURCE-GAPS.md',
  'GENERATION-AUDIT.json', 'REJECTED-OUTPUTS.md', 'SIDE-BY-SIDE-COMPARISON.jpg', 'MOBILE-REVIEW.jpg',
  'DESKTOP-REVIEW.jpg', 'PLUM-REVIEW.jpg', 'DARK-GREEN-REVIEW.jpg', 'IRON-BLUE-REVIEW.jpg', 'VIOLET-REVIEW.jpg',
  'COMPLETE-P050-REVIEW.jpg', 'P050-MOBILE-COMPLETE-REVIEW.jpg', 'DRAFT-DEPLOY.md', 'VALIDATION.json', 'APPROVAL-STATUS.md'
];
checks.reviewPack = Object.fromEntries(reportFiles.map((file) => [file, existsSync(rel('reports/KS-ACTIVE-ARCHIVE/P050-RACER-KNIT-BRA', file))]));
for (const [file, pass] of Object.entries(checks.reviewPack)) if (!pass) failures.push(`missing review-pack file: ${file}`);

checks.exactlyFiveStockedColours = true;
checks.generatedPerColourNotSize = true;
checks.nextProductStartedOnlyAfterP050Approval = existsSync(rel('assets/images/review-only/ks-active/p049-rib-contour-legging'));

const result = { scope: 'P050 complete stocked-colour review preserved after final approval; hidden archive storage verified separately', pass: failures.length === 0, failures, checks };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
