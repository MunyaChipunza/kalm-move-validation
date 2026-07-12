import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const packRoot = path.join(root, 'reports', 'KALM-VISUAL-RECOVERY-THIRD-DRAFT');
const ensure = target => fs.mkdirSync(target, { recursive: true });
const copy = relative => {
  const source = path.join(root, relative);
  if (!fs.existsSync(source)) return false;
  const destination = path.join(packRoot, relative.replace(/^reports[\\/]/, ''));
  ensure(path.dirname(destination));
  fs.copyFileSync(source, destination);
  return true;
};
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8').replace(/^\uFEFF/, ''));
const branch = execFileSync('git.exe', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
const head = execFileSync('git.exe', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const selected = readJson('reports/drive-recovery/selected-recovery-files.json');
const men = readJson('reports/drive-recovery/men-v3-recovery-manifest.json');
const women = readJson('reports/drive-recovery/women-source-recovery.json');
const bottles = readJson('reports/drive-recovery/bottle-image-recovery.json');
const outdoor = readJson('reports/drive-recovery/outdoor-source-recovery.json');

ensure(packRoot);
const staticEvidence = [
  'reports/drive-recovery/drive-asset-inventory.json',
  'reports/drive-recovery/drive-asset-inventory.csv',
  'reports/drive-recovery/drive-asset-inventory.md',
  'reports/drive-recovery/selected-recovery-files.json',
  'reports/drive-recovery/men-v3-recovery-manifest.json',
  'reports/drive-recovery/women-source-recovery.json',
  'reports/drive-recovery/bottle-image-recovery.json',
  'reports/drive-recovery/outdoor-source-recovery.json',
  'reports/drive-recovery/contact-sheets/ks-active-brand-candidates.webp',
  'reports/drive-recovery/contact-sheets/kalm-move-brand-candidates.webp',
  'reports/drive-recovery/contact-sheets/kalm-outdoor-brand-candidates.webp',
  'reports/drive-recovery/contact-sheets/kalm-wellness-brand-candidates.webp',
  'reports/drive-recovery/contact-sheets/kalm-home-brand-candidates.webp',
  'reports/drive-recovery/contact-sheets/men-v3-recovered-master.webp',
  'reports/drive-recovery/contact-sheets/women-historical-source-master.webp',
  'reports/drive-recovery/contact-sheets/bottle-candidates.webp',
  'reports/drive-recovery/contact-sheets/outdoor-lifestyle-candidates.webp',
  'reports/visual-recovery-preview-evidence/brands-desktop.png',
  'reports/visual-recovery-preview-evidence/mobile-footer-375x812.png'
];
for (const relative of staticEvidence) copy(relative);

const screenshotsRoot = path.join(root, 'reports', 'KALM-VISUAL-RECOVERY-THIRD-DRAFT', 'screenshots');
ensure(screenshotsRoot);
const thirdScreens = fs.existsSync(screenshotsRoot) ? fs.readdirSync(screenshotsRoot).filter(name => /third-draft|desktop|mobile|catalogue|footer|header/i.test(name)).sort() : [];
const report = {
  generatedAt: new Date().toISOString(),
  checkpoint: 'dc423b9686509a90c81de5fef25e9d9eeb1d8fc9',
  branch,
  headAtAssembly: head,
  productionChanged: false,
  draftPreview: 'pending_deploy',
  selectedDriveFiles: selected,
  men: { foundOutOf46: men.foundImageCount, usedInPreview: men.usedInPreviewCount, decision: men.decision },
  women: women.summary,
  bottles: bottles.summary,
  outdoor: { lifestyleCandidates: outdoor.candidates.length, brandPanel: outdoor.brandPanelDecision },
  screenshots: {
    secondDraftBrandsReference: 'visual-recovery-preview-evidence/brands-desktop.png',
    secondDraftMobileFooterReference: 'visual-recovery-preview-evidence/mobile-footer-375x812.png',
    thirdDraft: thirdScreens
  },
  unresolved: [
    'Munya visual approval is required before any production action.',
    'Men V3 staged images remain pending product-detail approval and are not wired.',
    'Drive entries with explicit hash-read errors remain inventory-only and are not recovery candidates.'
  ]
};
fs.writeFileSync(path.join(root, 'reports', 'KALM-VISUAL-RECOVERY-THIRD-DRAFT.json'), `${JSON.stringify(report, null, 2)}\n`);

const selectedRows = selected.map(item => `| ${item.PreviewUse} | ${item.LocalDestination} | \`${item.SourceSha256.slice(0, 12)}\` | ${item.ApprovalState} |`).join('\n');
const markdown = `# KALM Visual Recovery: Third Draft\n\n- Incident branch: \`${branch}\`\n- Checkpoint preserved: \`dc423b9686509a90c81de5fef25e9d9eeb1d8fc9\`\n- Production: unchanged\n- Draft preview: pending deployment\n\n## Recovered lifestyle candidates\n\n| Preview use | Local recovery path | SHA-256 prefix | Approval state |\n| --- | --- | --- | --- |\n${selectedRows}\n\n## Visual decisions\n\n- KALM Move uses the recovered adult man-and-woman natural-walking scene.\n- KALM Outdoor uses the recovered adults cooking and gathering scene.\n- The failed women v3 composites, the corrupted Studio Bottle image, and crude Outdoor accessory renders remain excluded.\n- Men V3: ${men.foundImageCount}/46 found, ${men.usedInPreviewCount} used. The historical men recovery remains active until Munya product-detail approval.\n\n## Included evidence\n\n- Drive inventory and hash/error records\n- Five branded candidate contact sheets\n- Men, women, bottle and Outdoor recovery reports\n- Second-draft Brands and mobile-footer reference screenshots\n- Third-draft screenshots are added after the Netlify draft is captured\n\n## Comparison: second draft to third draft\n\n| Area | Second draft | Third draft |\n| --- | --- | --- |\n| KALM Move Brands panel | Women-only/general lifestyle | Recovered adult man-and-woman walking scene |\n| KALM Outdoor Brands panel | Text-led pending photography | Recovered adults cooking and gathering scene |\n| Women | Clean historical recovery | Retained, no v3 composite restored |\n| Men | Historical recovery | Retained, V3 staging remains pending review |\n| Bottles | Clean recovery | Retained, corrupt Studio Bottle remains excluded |\n| Outdoor accessories | Text-led waitlist | Retained, no crude render restored |\n`;
fs.writeFileSync(path.join(root, 'reports', 'KALM-VISUAL-RECOVERY-THIRD-DRAFT.md'), markdown);
console.log(JSON.stringify({ packRoot: path.relative(root, packRoot), staticEvidenceFiles: staticEvidence.filter(relative => fs.existsSync(path.join(root, relative))).length, thirdScreens }, null, 2));
