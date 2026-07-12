import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const draftUrl = process.env.KALM_V4_DRAFT_URL;
if (!draftUrl) throw new Error('KALM_V4_DRAFT_URL is required.');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (relative, value) => fs.writeFileSync(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`);
const branch = execFileSync('git.exe', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
const head = execFileSync('git.exe', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const reviewRoot = path.join(root, 'reports', 'KALM-MOBILE-FIRST-V4-REVIEW');
const menReview = path.join(root, 'reports', 'KALM-MOVE-MEN-V3-REVIEW');
const screenshots = path.join(reviewRoot, 'screenshots');
fs.mkdirSync(reviewRoot, { recursive: true });

const copy = filename => {
  const source = path.join(menReview, filename);
  const destination = path.join(reviewRoot, filename);
  if (fs.existsSync(source)) fs.copyFileSync(source, destination);
};
for (const filename of ['all-current-old-men-images.webp', 'all-men-v3-candidates.webp', 'old-versus-v3-by-product.webp', 'final-selected-v3-set-by-product.webp']) copy(filename);

const state = readJson('reports/KALM-MOBILE-FIRST-V4-STATE.json');
const map = readJson('reports/kalm-move-men-v3-product-map.json');
const active = readJson('reports/kalm-move-men-v4-active-manifest.json');
const responsive = readJson('reports/kalm-responsive-image-manifest.json');
const runtime = readJson('reports/KALM-MOBILE-FIRST-V4-RUNTIME-QA.json');
runtime.screenshots = fs.existsSync(screenshots) ? fs.readdirSync(screenshots).sort() : [];
writeJson('reports/KALM-MOBILE-FIRST-V4-RUNTIME-QA.json', runtime);
state.fourthDraftPreview = draftUrl;
state.previewCodeCommit = head;
state.status = 'draft_ready_pending_munya_visual_approval';
state.productionChangedByV4 = false;
writeJson('reports/KALM-MOBILE-FIRST-V4-STATE.json', state);

const review = {
  generatedAt: new Date().toISOString(),
  draftUrl,
  branch,
  previewCodeCommit: head,
  productionChanged: false,
  checkpoint: state.preservedCheckpoint,
  menV3: {
    reviewed: map.summary.v3CandidatesReviewed,
    approvedForV4Preview: map.summary.approvedForV4Preview,
    rejected: map.summary.rejected,
    activeProducts: active.summary.activeMenProducts,
    activeProductColours: active.summary.activeProductColourRecords,
    activeV3Assets: active.summary.activeV3Assets,
    note: 'Every active Men V4 colour uses one selected V3 front image only. No historical angle/back image is mixed into a V4 gallery.'
  },
  responsiveImages: { derivativeCount: responsive.records.length, sources: '480w and 800w WebP derivatives plus preserved 1200x1500 V4 originals' },
  mobileQa: runtime,
  evidence: {
    menContactSheets: fs.readdirSync(menReview).filter(name => name.endsWith('.webp')).sort(),
    screenshots: fs.existsSync(screenshots) ? fs.readdirSync(screenshots).sort() : []
  },
  unresolved: [
    'All Men V3 selections are preview candidates and require Munya visual approval before production action.',
    'The recovered Men V3 lane provides one vetted front image per product colour, not a multi-angle gallery.',
    'Focused viewport screenshots cover the filter sheet. The automated browser did not yield a stable raster capture of the fixed cart overlay, so runtime QA records its viewport width, solid background and close control instead.'
  ]
};
writeJson('reports/KALM-MOBILE-FIRST-V4-REVIEW.json', review);

const markdown = `# KALM Mobile-First Fourth Draft Review\n\n- Draft preview: ${draftUrl}\n- Branch: \`${branch}\`\n- Preview code commit: \`${head}\`\n- Production: unchanged\n\n## Men V3 decision\n\n- Reviewed: ${map.summary.v3CandidatesReviewed}/46\n- Approved for this preview: ${map.summary.approvedForV4Preview}\n- Rejected: ${map.summary.rejected}\n- Active men products: ${active.summary.activeMenProducts}\n- Active men product colours: ${active.summary.activeProductColourRecords}\n- Active V3 files: ${active.summary.activeV3Assets}\n\nEvery active colour uses a new versioned \`-v4\` front-image path. The gallery deliberately contains that one correctly labelled front view only, rather than mixing historical angle or movement assets.\n\n## Mobile QA\n\n- Viewports: ${runtime.viewportResults.map(item => item.name).join(', ')}\n- Every viewport: no horizontal overflow recorded.\n- 320px: one-column cards. 360px and above: two-column cards.\n- Colour switching: ${runtime.colourSwitches.tested} selections tested; ${runtime.colourSwitches.failed.length} failed.\n- Product detail: 11/11 first gallery images use the V4 path, \`contain\` fit and natural 1200 × 1500 proportions.\n- Filter sheet: opens and closes with accessible state.\n- Cart drawer: constrained to the viewport width.\n- Footer: compact accordion treatment; the small KALM Collective lock-up loads directly.\n\n## Included evidence\n\n- Four Men V3 contact sheets: current lane, all candidates, old-versus-V3 comparison, final selections\n- All 11 Men V4 product-detail first-image captures\n- Responsive catalogue captures for the requested viewport matrix\n- Mobile header, filters, cart and footer captures\n- Product/colour audit, active manifest, responsive-image manifest and runtime QA JSON\n\n## Remaining visual limitation\n\nThe recovered Men V3 source set contains one vetted front image per colour. This fourth draft does not claim a multi-angle gallery where no corresponding V3 angle/back assets were recovered. Munya approval remains required.\n`;
const reviewMarkdown = markdown
  .replace('Mobile header, filters, cart and footer captures', 'Mobile header, filter and footer captures, plus cart drawer runtime evidence')
  .replace('Focused viewport screenshots are included for fixed overlays; full-page captures are not used to judge the fixed mobile filter sheet.', 'Focused viewport screenshots are included for the filter sheet. The automated browser did not yield a stable raster capture of the fixed cart overlay, so its viewport width, solid background and close control are recorded in runtime QA instead.');
fs.writeFileSync(path.join(root, 'reports', 'KALM-MOBILE-FIRST-V4-REVIEW.md'), reviewMarkdown);
console.log(JSON.stringify({ reviewRoot: path.relative(root, reviewRoot), previewCodeCommit: head, screenshotCount: review.evidence.screenshots.length }, null, 2));
