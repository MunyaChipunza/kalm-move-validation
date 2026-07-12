import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (relative, value) => fs.writeFileSync(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`);
const catalog = readJson('products.json');
const inventory = readJson('reports/drive-recovery/drive-asset-inventory.json');
const selected = readJson('reports/drive-recovery/selected-recovery-files.json');
const generatedAt = new Date().toISOString();

const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const collection = value => Array.isArray(value) ? value : value ? [value] : [];
const byPath = predicate => inventory.filter(predicate);
const hash = record => record?.Sha256 || null;
const imageRecord = record => ({
  drivePath: record.FullDrivePath,
  sha256: hash(record),
  dimensions: record.Width && record.Height ? `${record.Width}x${record.Height}` : null,
  modifiedTime: record.ModifiedTime,
  reviewStatus: record.ReviewStatus,
  hashReadError: record.HashError || null
});
const moveProducts = catalog.products.filter(product => product.brandId === 'kalm-move');
const getVariantHero = (product, colour) => product.variantImages?.[colour]?.hero || product.image || null;

const MEN_STAGING = [
  ['kalm-move-flow-training-short', 'flow-training-short-v3', ['Black', 'Charcoal', 'Navy', 'Olive']],
  ['kalm-move-sprint-running-short', 'sprint-running-short-v3', ['Black', 'Navy', 'Cobalt', 'Charcoal']],
  ['kalm-move-core-performance-tee', 'core-performance-tee-v3', ['Black', 'White', 'Charcoal', 'Navy', 'Olive']],
  ['kalm-move-lift-tank', 'lift-tank-v3', ['Black', 'White', 'Charcoal', 'Navy']],
  ['kalm-move-pace-jogger', 'pace-jogger-v3', ['Black', 'Charcoal', 'Stone', 'Navy', 'Olive']],
  ['kalm-move-motion-hoodie', 'motion-hoodie-v3', ['Black', 'Charcoal', 'Stone', 'Olive', 'Navy']],
  ['kalm-move-base-compression-short', 'base-compression-short-v3', ['Black', 'Charcoal', 'Navy']],
  ['kalm-move-cap', 'move-cap-v3', ['Black', 'White', 'Navy', 'Olive', 'Charcoal']],
  ['kalm-move-training-sock-3-pack', 'training-sock-3-pack-v3', ['Black Pack', 'White Pack', 'Mixed Neutral Pack']],
  ['kalm-move-utility-gym-bag', 'utility-gym-bag-v3', ['Black', 'Charcoal', 'Olive', 'Navy']],
  ['kalm-move-protein-shaker-bottle', 'protein-shaker-bottle-v3', ['Black', 'Charcoal', 'Navy', 'Smoke Grey']]
];

const menImages = MEN_STAGING.flatMap(([productId, stagingSlug, colours]) => {
  const product = moveProducts.find(item => item.id === productId);
  return colours.map(colour => {
    const colourDirectory = normalize(colour);
    const marker = `\\men-embedded-logo-v3\\${stagingSlug}\\${colourDirectory}\\front.webp`;
    const matches = byPath(record => record.FullDrivePath.toLowerCase().endsWith(marker));
    const pngMarker = `\\men-embedded-logo-v3\\${stagingSlug}\\${colourDirectory}\\front-source.png`;
    const sourcePng = byPath(record => record.FullDrivePath.toLowerCase().endsWith(pngMarker));
    return {
      product: product?.title || productId,
      productId,
      colour,
      expectedPath: `assets/images/staged/kalm-move/men-embedded-logo-v3/${stagingSlug}/${colourDirectory}/front.webp`,
      actualDrivePaths: matches.map(imageRecord),
      actualExistence: matches.length > 0,
      matchingSourcePngExistence: sourcePng.length > 0,
      currentLiveImagePath: getVariantHero(product, colour),
      visualComparisonResult: 'Contact-sheet review found a coherent studio image, but this is staged generated embedded-mark imagery and requires Munya product-detail approval.',
      betterThanCurrentProduction: 'not_proven',
      extraOrIncorrectMark: 'No oversized duplicate mark seen at contact-sheet scale; exact mark fidelity remains pending detail review.',
      candidateStatus: matches.length > 0 ? 'found_pending_review' : 'missing',
      previewDecision: 'retain_best_historical_current_preview_path'
    };
  });
});
writeJson('reports/drive-recovery/men-v3-recovery-manifest.json', {
  generatedAt,
  stagingManifestSource: 'MEN_EMBEDDED_LOGO_V3_MANIFEST.md',
  expectedImageCount: 46,
  foundImageCount: menImages.filter(item => item.actualExistence).length,
  usedInPreviewCount: 0,
  decision: 'No men V3 staged image is wired in the third draft. The existing historical men-recovery-v2 lane remains active until Munya gives product-detail approval.',
  contactSheet: 'reports/drive-recovery/contact-sheets/men-v3-recovered-master.webp',
  images: menImages
});

const menIds = new Set(MEN_STAGING.map(([id]) => id));
const womenProducts = moveProducts.filter(product => !menIds.has(product.id) && product.type !== 'Bottle');
const womenCandidates = byPath(record => /\\assets\\images\\products\\kalm-move\\women\\/i.test(record.FullDrivePath) && !/-v3/i.test(record.FullDrivePath));
const women = womenProducts.flatMap(product => product.colors.map(colour => ({
  product: product.title,
  productId: product.id,
  colour,
  currentFailedProductionImage: 'quarantined; no v3 composite is eligible for restoration',
  secondDraftRestoredImage: getVariantHero(product, colour),
  matchingDriveHistoricalCandidates: womenCandidates.filter(record => record.FullDrivePath.toLowerCase().includes(product.id.replace(/^kalm-move-/, ''))).map(imageRecord),
  gitHistoricalSource: '07258b3a6f2960718750a78b57a01f9537d4ce34 where applicable',
  supplierReferenceEvidence: 'KALM_MOVE_IMAGE_REBUILD_AUDIT.md',
  visualQuality: 'retain second-draft historical restoration unless a source candidate proves cleaner at visual review',
  garmentAccuracy: 'second-draft source retained',
  logoState: 'no post-hoc buffalo mark permitted',
  preferredPreviewCandidate: getVariantHero(product, colour),
  decision: 'retain_second_draft'
})));
writeJson('reports/drive-recovery/women-source-recovery.json', {
  generatedAt,
  sourceAudit: 'KALM_MOVE_IMAGE_REBUILD_AUDIT.md',
  gitAnchor: '03011bdc8655f93d3a6f71ee669506c79d9c70fb',
  contactSheet: 'reports/drive-recovery/contact-sheets/women-historical-source-master.webp',
  prohibitedLane: 'All failed women -v3 buffalo composites remain quarantined.',
  summary: { products: womenProducts.length, productColourRecords: women.length, driveCandidateFiles: womenCandidates.length, previewChanges: 0 },
  comparisons: women
});

const bottleProducts = moveProducts.filter(product => product.type === 'Bottle');
const bottleCandidates = byPath(record => /bottle/i.test(record.FullDrivePath));
const bottles = bottleProducts.flatMap(product => product.colors.map(colour => ({
  product: product.title,
  productId: product.id,
  colour,
  currentPreviewImage: getVariantHero(product, colour),
  driveCandidates: bottleCandidates.filter(record => record.FullDrivePath.toLowerCase().includes(product.id.replace('kalm-move-', '')) || record.FullDrivePath.toLowerCase().includes(normalize(product.title))).map(imageRecord),
  gitHistoricalSource: product.id === 'kalm-move-studio-bottle' ? '5d33e4b415ee0834a08d5cc7cbcebdd3bfa5d5ee clean front-image source' : 'second-draft retained source',
  corruptedStudioBottleEligible: false,
  preferredPreviewCandidate: getVariantHero(product, colour),
  decision: 'retain_second_draft_clean_source'
})));
writeJson('reports/drive-recovery/bottle-image-recovery.json', {
  generatedAt,
  contactSheet: 'reports/drive-recovery/contact-sheets/bottle-candidates.webp',
  studioBottleRule: 'The corrupted Studio Bottle image is excluded and is not eligible for copy or preview use.',
  summary: { products: bottleProducts.length, productColourRecords: bottles.length, previewChanges: 0 },
  comparisons: bottles
});

const outdoorCandidates = byPath(record => record.BrandClassification === 'KALM Outdoor' && /lifestyle|hosting|cooking|braai|patio|garden|scene|brand-heroes/i.test(record.FullDrivePath));
const selectedOutdoor = selected.find(record => record.PreviewUse === 'KALM Outdoor Brands-page lifestyle panel');
writeJson('reports/drive-recovery/outdoor-source-recovery.json', {
  generatedAt,
  sourceAudit: 'OUTDOOR_IMAGE_ASSET_INDEX.md',
  contactSheet: 'reports/drive-recovery/contact-sheets/outdoor-lifestyle-candidates.webp',
  brandPanelDecision: {
    selectedCandidate: selectedOutdoor,
    visualResult: 'Adults cooking and gathering around Outdoor equipment are visible in the recovered historical hero.',
    previewUse: 'enabled in the third draft',
    approvalState: 'preview_candidate_pending_munya_visual_approval'
  },
  candidates: outdoorCandidates.map(record => ({
    ...imageRecord(record),
    likelyUse: record.LikelyUse,
    assessment: /kalm-outdoor-brand-hero-lifestyle-v1/i.test(record.FileName) ? 'selected_preview_candidate' : 'not_selected_for_brand_panel'
  })),
  accessoryPolicy: 'No low-detail Outdoor accessory render is reactivated. Unsourced accessories remain text-led, compatibility-led, and waitlist-only.'
});

console.log(JSON.stringify({ menRecords: menImages.length, womenRecords: women.length, bottleRecords: bottles.length, outdoorCandidates: outdoorCandidates.length }, null, 2));
