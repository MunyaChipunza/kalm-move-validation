import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rel = (...parts) => resolve(process.cwd(), ...parts);
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();
const manifestPath = rel('assets/images/products/ks-active/archive-approved/p050-racer-knit-bra/APPROVED-PRODUCT.json');
const approvedIndexPath = rel('ks-active-approved-archive-products.json');
const failures = [];
const checks = {};

checks.approvedProductPresent = existsSync(manifestPath);
const product = checks.approvedProductPresent ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
checks.identity = Boolean(product && product.productCode === 'P050' && product.approvedName === 'KS Active Racer Knit Bra' && product.approvedSlug === 'ks-active-racer-knit-bra');
checks.hiddenOnly = Boolean(product && product.catalogueState && Object.values(product.catalogueState).every((value) => value === false));
checks.stockTotal = Boolean(product && product.stock && product.stock.totalUnits === 11 && product.stock.variants.reduce((sum, variant) => sum + variant.quantity, 0) === 11);
checks.stockSkuCount = Boolean(product && product.stock && product.stock.variants.length === 11 && new Set(product.stock.variants.map((variant) => variant.sku)).size === 11);
checks.driveRename = Boolean(product && product.source && product.source.driveFolderId === '1-SBFJrpneVQMdtJBzDyuSpI1ShtprYmV' && product.source.originalDriveFolderName === 'Seamless Knit Racer Back Sports Bra' && product.source.renamedDriveFolderName === 'P050 - Racer Knit Bra');

const assets = product?.storedAssets?.assets || [];
checks.twentyApprovedAssets = assets.length === 20;
checks.storageHashes = assets.every((asset) => {
  const stored = rel('assets/images/products/ks-active/archive-approved/p050-racer-knit-bra', asset.file);
  const review = rel('assets/images/review-only/ks-active/p050-racer-knit-bra/generated', asset.file);
  return existsSync(stored) && existsSync(review) && sha256(stored) === asset.sha256 && sha256(review) === asset.sha256;
});
checks.approvedArchiveIndex = existsSync(approvedIndexPath) && JSON.parse(readFileSync(approvedIndexPath, 'utf8')).products.some((entry) => entry.productCode === 'P050' && entry.classification === 'approved_archive' && entry.publicCatalogueState === 'hidden_pending_archive_launch');
checks.noPublicProductReference = ['products.json', 'index.html', 'script.js', 'sitemap.xml', 'robots.txt'].every((file) => !readFileSync(rel(file), 'utf8').includes('archive-approved/p050-racer-knit-bra'));

for (const [name, passed] of Object.entries(checks)) if (!passed) failures.push(name);
const result = { scope: 'P050 approved hidden archive storage only', pass: failures.length === 0, failures, checks };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
