import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const rel = (...parts) => resolve(root, ...parts);
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();
const productCode = 'P049';
const slug = 'p049-rib-contour-legging';
const reviewBase = rel('assets/images/review-only/ks-active/p049-rib-contour-legging');
const destination = rel('assets/images/products/ks-active/archive-approved/p049-rib-contour-legging');
const reportDir = rel('reports/KS-ACTIVE-ARCHIVE/P049-RIB-CONTOUR-LEGGING');
const reviewManifest = JSON.parse(readFileSync(rel(reportDir, 'P049-COMPLETE-ASSET-MANIFEST.json'), 'utf8'));
const sourceManifest = JSON.parse(readFileSync(rel(reportDir, 'SOURCE-MANIFEST.json'), 'utf8'));
const indexPath = rel('ks-active-approved-archive-products.json');

if (existsSync(destination)) throw new Error(`Refusing to overwrite existing approved storage: ${destination}`);
mkdirSync(destination, { recursive: true });

const variants = [
  { colour: 'Bright Green', size: 'S', quantity: 1, sku: 'KS-ARCH-P049-BRGRE-S' },
  { colour: 'White', size: 'M', quantity: 1, sku: 'KS-ARCH-P049-WHITE-M' },
  { colour: 'Peach Yellow', size: 'M', quantity: 1, sku: 'KS-ARCH-P049-PEAYEL-M' },
  { colour: 'Egyptian Blue', size: 'M', quantity: 1, sku: 'KS-ARCH-P049-EGYBLU-M' },
  { colour: 'Gray', size: 'M', quantity: 1, sku: 'KS-ARCH-P049-GRAY-M' },
  { colour: 'Red', size: 'M', quantity: 2, sku: 'KS-ARCH-P049-RED-M' }
];
const sourcePath = reviewManifest.assets.find((asset) => asset.role === 'supplier_construction_reference');
const generated = reviewManifest.assets.filter((asset) => asset.role === 'generated_model_review');
if (!sourcePath || generated.length !== 24) throw new Error('P049 review manifest is incomplete. Expected one source and 24 generated assets.');

const storedAssets = generated.map((asset) => {
  const source = rel(asset.path);
  const file = asset.path.split('/').at(-1);
  const target = resolve(destination, file);
  copyFileSync(source, target, 0);
  const sourceHash = sha256(source);
  const targetHash = sha256(target);
  if (sourceHash !== asset.sha256 || targetHash !== sourceHash) throw new Error(`Hash mismatch while storing ${file}`);
  return { colour: asset.colour, view: asset.view, file, sha256: targetHash, dimensions: asset.dimensions };
});

const approved = {
  schemaVersion: 1,
  productCode,
  approvedName: 'KS Active Rib Contour Legging',
  approvedSlug: 'ks-active-rib-contour-legging',
  approval: {
    approvedBy: 'Munya',
    approvedDate: '2026-07-14',
    approvalEvidence: 'reports/KS-ACTIVE-ARCHIVE/P049-RIB-CONTOUR-LEGGING/APPROVAL-STATUS.md',
    scope: 'complete hidden KS Active Archive product package; five manual-label colour representations were approved after physical comparison; public release not authorised'
  },
  source: {
    originalSourceName: 'High Waisted Ribbed Yoga Pants / Ribbed Leggings',
    driveFolderId: sourceManifest.driveSourceFolder.id,
    originalDriveFolderNameAtApproval: 'P049 - Rib Contour Legging',
    renamedDriveFolderName: 'P049 - Rib Contour Legging',
    driveRenameRecord: 'Folder already matched the approved final name when full P049 approval was received; Drive ID and parent were verified unchanged.',
    sourceManifest: 'reports/KS-ACTIVE-ARCHIVE/P049-RIB-CONTOUR-LEGGING/SOURCE-MANIFEST.json',
    exactSourceHashes: { supplierConstructionReference: sourcePath.sha256 }
  },
  catalogueState: {
    public: false,
    purchasable: false,
    productsJsonChanged: false,
    zohoUpdated: false,
    intranetUpdated: false,
    productionDeployed: false
  },
  stock: {
    totalUnits: 7,
    variants,
    futureZeroStockRule: 'Normal future sizes with zero confirmed stock must display Out of stock and be disabled.'
  },
  rejectedAssets: [
    'reports/KS-ACTIVE-ARCHIVE/P049-RIB-CONTOUR-LEGGING/rejected-generated-v1/bright-green-hero-three-quarter.png',
    'reports/KS-ACTIVE-ARCHIVE/P049-RIB-CONTOUR-LEGGING/rejected-generated-v1/bright-green-back.png',
    'reports/KS-ACTIVE-ARCHIVE/P049-RIB-CONTOUR-LEGGING/rejected-generated-v1/bright-green-side-same-model.png',
    'reports/KS-ACTIVE-ARCHIVE/P049-RIB-CONTOUR-LEGGING/rejected-generated-v1/egyptian-blue-muted-first-attempt.png'
  ],
  storedAssets: {
    directory: 'assets/images/products/ks-active/archive-approved/p049-rib-contour-legging/',
    hashCopyVerification: 'passed; each storage file matches its review-only approved source file',
    assets: storedAssets
  }
};

const approvedPath = resolve(destination, 'APPROVED-PRODUCT.json');
writeFileSync(approvedPath, `${JSON.stringify(approved, null, 2)}\n`, 'utf8');

const index = JSON.parse(readFileSync(indexPath, 'utf8'));
if (index.products.some((product) => product.productCode === productCode)) throw new Error('P049 is already present in approved archive index.');
index.products.push({
  productCode,
  name: approved.approvedName,
  slug: approved.approvedSlug,
  classification: 'approved_archive',
  publicCatalogueState: 'hidden_pending_final_range_review',
  package: 'assets/images/products/ks-active/archive-approved/p049-rib-contour-legging/APPROVED-PRODUCT.json',
  stockedColours: variants.map((variant) => variant.colour),
  confirmedQuantity: 7,
  driveFolderId: approved.source.driveFolderId,
  approvedAt: '2026-07-14'
});
index.products.sort((a, b) => a.productCode.localeCompare(b.productCode));
writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');

const storageValidation = {
  scope: 'P049 approved hidden archive storage only',
  passed: true,
  storedAssets: storedAssets.length,
  sourceHash: sourcePath.sha256,
  stockUnits: variants.reduce((total, variant) => total + variant.quantity, 0),
  skuCount: new Set(variants.map((variant) => variant.sku)).size,
  publicStorefrontMutation: false,
  zohoUpdated: false,
  intranetUpdated: false,
  productionDeployed: false
};
writeFileSync(resolve(reportDir, 'APPROVED-STORAGE-VALIDATION.json'), `${JSON.stringify(storageValidation, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ approvedPath, destination, storedAssets: storedAssets.length, indexPath }, null, 2));
