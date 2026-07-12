import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const readJson = relative => JSON.parse(read(relative).replace(/^\uFEFF/, ''));
const catalog = readJson('products.json');
const selected = readJson('reports/drive-recovery/selected-recovery-files.json');
const menManifest = readJson('reports/drive-recovery/men-v3-recovery-manifest.json');
const sha256 = relative => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex').toUpperCase();
const fail = message => { throw new Error(message); };

const publicSources = ['products.json', 'script.js', 'styles.css', 'index.html', 'site.webmanifest'].map(read).join('\n');
if (/G:\\|My Drive|drive\.google\.com/i.test(publicSources)) fail('Drive source path leaked into a public storefront file.');
if (/women[^"'\n]*-v3/i.test(JSON.stringify(catalog))) fail('Failed KALM Move women v3 composite path is active.');
if (/assets\/images\/generated\/kalm-outdoor/i.test(JSON.stringify(catalog))) fail('Zero-paid Outdoor render path is active.');
if (/studio-bottle\/(?:[^"']*\/)?(?:movement|lifestyle)\.webp/i.test(JSON.stringify(catalog))) fail('Corrupted Studio Bottle path is active.');
if (/men-embedded-logo-v3/i.test(JSON.stringify(catalog))) fail('Unapproved staged men V3 lane is active in products.json.');

const logos = catalog.brands.map(brand => brand.approvedLogo || brand.logo);
if (logos.some(logo => !logo)) fail('A brand is missing an approved unique logo path.');
if (new Set(logos).size !== catalog.brands.length) fail('A logo is reused by multiple brands.');

const move = catalog.brands.find(brand => brand.id === 'kalm-move');
const outdoor = catalog.brands.find(brand => brand.id === 'kalm-outdoor');
if (move.heroImage !== 'assets/images/recovered/brands-v1/kalm-move-brand-hero-lifestyle-v1.webp') fail('KALM Move recovery hero is not wired.');
if (outdoor.heroImage !== 'assets/images/recovered/brands-v1/kalm-outdoor-brand-hero-lifestyle-v1.webp') fail('KALM Outdoor recovery hero is not wired.');
if (outdoor.visualMode === 'text-led') fail('KALM Outdoor remains text-led despite the recovered lifestyle panel.');

for (const record of selected) {
  if (!record.LocalDestination.startsWith('assets/images/recovered/')) fail(`Recovery file is not versioned under a recovered directory: ${record.LocalDestination}`);
  if (!fs.existsSync(path.join(root, record.LocalDestination))) fail(`Selected recovery file is missing: ${record.LocalDestination}`);
  if (record.SourceSha256 !== record.LocalSha256 || sha256(record.LocalDestination) !== record.SourceSha256) fail(`Hash verification failed for ${record.LocalDestination}`);
  const trackedAtHead = execFileSync('git.exe', ['ls-tree', '-r', '--name-only', 'HEAD', '--', record.LocalDestination], { cwd: root, encoding: 'utf8' }).trim();
  if (trackedAtHead) fail(`Recovery file overwrote an existing public path: ${record.LocalDestination}`);
}

if (menManifest.usedInPreviewCount !== 0) fail('The men V3 manifest reports an unapproved staged image in preview use.');
if (menManifest.images.some(item => item.previewDecision !== 'retain_best_historical_current_preview_path')) fail('A staged men V3 decision lacks the required historical-preview fallback.');

console.log(JSON.stringify({
  status: 'passed',
  selectedRecoveryFiles: selected.length,
  recoveredMoveHero: move.heroImage,
  recoveredOutdoorHero: outdoor.heroImage,
  menV3PreviewImages: menManifest.usedInPreviewCount,
  uniqueBrandLogos: logos.length
}, null, 2));
