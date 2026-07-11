#!/usr/bin/env node
/**
 * Validate the KALM Move women branding audit and local-repair decision without
 * touching source images or the live catalogue.
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const fail = (message) => {
  throw new Error(message);
};
const assert = (condition, message) => {
  if (!condition) fail(message);
};

const audit = readJson('reports/kalm-move-women-branding-audit.json');
const manifest = readJson('reports/kalm-move-women-local-repair-manifest.json');
const catalogue = readJson('products.json');
const expectedFields = [
  'product_id',
  'colour',
  'source_path',
  'view',
  'original_mark_status',
  'legacy_mark_bounding_polygon',
  'removal_mask_path',
  'approved_mark_placement_polygon',
  'approved_mark_scale',
  'approved_mark_rotation_degrees',
  'perspective_transform',
  'opacity',
  'blend_method',
  'corrected_output_path',
  'qa_status',
  'rejection_reason',
  'final_decision',
];

assert(audit.summary.women_products === 22, 'Expected 22 KALM Move women products in the audit.');
assert(audit.summary.garment_products === 19, 'Expected 19 garment products in the audit.');
assert(audit.summary.non_garment_products === 3, 'Expected 3 non-garment products in the audit.');
assert(audit.summary.image_records === 320, 'Expected 320 image records in the audit.');
assert(manifest.paid_image_usage === 0, 'Paid image usage must remain zero.');
assert(manifest.summary.records === 320, 'Manifest must include every audited image record.');
assert(manifest.summary.garment_repair_records === 294, 'Manifest garment repair count is incorrect.');
assert(manifest.summary.non_garment_preserved_records === 26, 'Manifest bottle record count is incorrect.');
assert(manifest.summary.approved_local_repairs === 0, 'No unreviewed local repair may be approved.');
assert(manifest.contact_sheet_review?.reviewed === true, 'Contact-sheet review must be recorded.');
assert(manifest.contact_sheet_review?.approved_local_repairs === 0, 'Contact-sheet review may not approve a repair.');

const catalogueProductIds = new Set(catalogue.products.map((product) => product.id));
const auditKeys = new Set(audit.records.map((record) => `${record.product_id}|${record.colour}|${record.image_path}`));
assert(manifest.records.length === audit.records.length, 'Manifest record count differs from audit record count.');

for (const record of manifest.records) {
  for (const field of expectedFields) {
    assert(Object.hasOwn(record, field), `Missing required manifest field ${field} for ${record.source_path}.`);
  }
  assert(catalogueProductIds.has(record.product_id), `Unknown product ${record.product_id}.`);
  assert(auditKeys.has(`${record.product_id}|${record.colour}|${record.source_path}`), `Manifest record is not in the audit: ${record.source_path}.`);
  assert(fs.existsSync(path.join(root, record.source_path)), `Missing source image: ${record.source_path}.`);
  assert(record.corrected_output_path.startsWith('assets/images/products/kalm-move/women/'), `Invalid v3 output root: ${record.corrected_output_path}.`);
  assert(record.corrected_output_path.includes('-v3/'), `Corrected output must use a versioned v3 path: ${record.corrected_output_path}.`);
  assert(record.final_decision === 'preserve_existing_live_image', `Only preserve decisions are permitted without visual approval: ${record.source_path}.`);
  assert(record.opacity === 0, `Unapproved image must not carry a visible replacement mark: ${record.source_path}.`);
  assert(record.blend_method === 'not_attempted', `Unapproved image must not be marked as composited: ${record.source_path}.`);
}

for (const product of catalogue.products.filter((product) => product.collection === 'KALM Move')) {
  const imageText = JSON.stringify(product.images ?? product);
  assert(!imageText.includes('-v3/'), `Live catalogue references an unapproved v3 image for ${product.id}.`);
}

console.log(JSON.stringify({
  status: 'passed',
  paid_image_usage: manifest.paid_image_usage,
  audited_records: manifest.records.length,
  approved_local_repairs: manifest.summary.approved_local_repairs,
  live_catalogue_v3_references: 0,
}, null, 2));
