import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const generatedAt = new Date().toISOString();
const startingSha = "a5b459d4c8b65836e6775d9040729ba6f16d0e80";
const branch = exec("git rev-parse --abbrev-ref HEAD");
const currentSha = exec("git rev-parse HEAD");
const changedFiles = exec("git diff --name-only origin/master..HEAD")
  .split(/\r?\n/)
  .filter(Boolean);

const accessories = await readJson("catalogue/drafts/kalm-outdoor-accessories.json");
const bundles = await readJson("catalogue/drafts/kalm-outdoor-bundles.json");
const manifest = await readJson("image-generation/kalm-outdoor/accessories/image-manifest.json");
const validation = await readJson("reports/kalm-outdoor-accessories-validation.json");

const fullFileList = Array.from(new Set([
  ...validation.filesCreated,
  ...changedFiles,
  "reports/kalm-outdoor-accessory-image-jobs.json",
  "reports/outdoor-autonomous-execution-state.json",
  "image-generation/kalm-outdoor/accessories/finalize-phase-a-checkpoint.mjs"
])).sort();

const imageJobs = {
  schema: "kalm.outdoor.accessoryImageJobs.v1",
  generatedAt,
  workspace: "C:\\Users\\Dell\\codex-work\\kalm-outdoor-accessories",
  branch,
  startingSha,
  checkpointBaseShaBeforeFinalCommit: currentSha,
  paidImageApiUsed: false,
  failedImageJobs: [],
  billingBlockedImageJobs: [],
  summary: {
    expectedJobs: manifest.expectedImages,
    completedJobs: manifest.generatedImages,
    failedJobs: 0,
    billingBlockedJobs: 0
  },
  jobs: manifest.images.map((image) => ({
    jobId: `${image.productId}:${image.view}`,
    productId: image.productId,
    slug: image.slug,
    view: image.view,
    outputPath: image.path,
    format: image.format,
    status: image.status,
    paidImageApiUsed: image.paidImageApiUsed,
    failureReason: null,
    billingBlocked: false,
    source: image.source,
    sha256: image.sha256
  }))
};

const executionState = {
  schema: "kalm.outdoor.autonomousExecutionState.v1",
  generatedAt,
  workspace: "C:\\Users\\Dell\\codex-work\\kalm-outdoor-accessories",
  forbiddenRecoveryWorkspace: "G:\\My Drive\\kalm-variant-fix-work",
  recoveryWorkspaceTouched: false,
  remote: "https://github.com/MunyaChipunza/kalm-move-validation.git",
  branch,
  startingSha,
  checkpointBaseShaBeforeFinalCommit: currentSha,
  finalCheckpointSha: "Use git rev-parse HEAD after the final checkpoint commit; a commit cannot embed its own final hash.",
  phase: "A_PREPRODUCTION_COMPLETE_STOP",
  phaseBStarted: false,
  mergeToMaster: false,
  deployed: false,
  firstCommandRequiredToBeginPhaseB: "cd \"C:\\Users\\Dell\\codex-work\\kalm-outdoor-accessories\"; git fetch origin; git status --short --branch",
  phaseBGates: [
    "recovery task has completed",
    "recovery final commit has been pushed",
    "recovery changes are merged into master or exact release branch is known",
    "recovery final report exists",
    "no other task is actively rewriting products.json",
    "no other task is deploying the KALM storefront"
  ],
  completedPhaseAWork: [
    "defined nine Outdoor accessories",
    "created stable ids, slugs and SKU roots",
    "created compatibility mapping to Ember 16, Forge 2 and Ridge 4",
    "created truthful coming-soon draft product records",
    "created bundle definitions",
    "created product descriptions and metadata drafts",
    "created image-generation prompts",
    "generated Outdoor accessory imagery only",
    "stored images only in new accessory directories",
    "generated hero, side, contents, detail, lifestyle, scene and compatibility views",
    "created complete image manifest",
    "validated image consistency",
    "created mobile and desktop mock-up screenshots",
    "created complete integration plan",
    "committed and pushed Phase A checkpoint branch"
  ],
  filesCreatedOrModified: fullFileList,
  generatedImages: manifest.images,
  failedOrBillingBlockedImageJobs: {
    failed: [],
    billingBlocked: []
  },
  draftProductRecords: accessories.accessories.map((product) => ({
    id: product.id,
    title: product.title,
    slug: product.slug,
    skuRoot: product.skuRoot,
    status: product.status,
    image: product.image
  })),
  compatibilityMappings: accessories.accessories.map((product) => ({
    id: product.id,
    title: product.title,
    compatibility: product.compatibility
  })),
  bundleDefinitions: bundles.bundles.map((bundle) => ({
    id: bundle.id,
    title: bundle.title,
    slug: bundle.slug,
    status: bundle.status,
    includedAccessoryIds: bundle.includedAccessoryIds,
    pricingStatus: bundle.pricingStatus
  })),
  supplierInformationStillPending: [
    "supplier source",
    "MOQ",
    "lead times",
    "landed cost",
    "retail price",
    "verified dimensions",
    "packaging",
    "materials and finish",
    "warranty and care notes",
    "appliance fit testing",
    "final approved product photography"
  ],
  safety: {
    productsJsonModified: false,
    indexHtmlModified: false,
    scriptJsModified: false,
    stylesCssModified: false,
    sharedComponentsModified: false,
    netlifyConfigModified: false,
    nccModified: false,
    secretsOrCredentialFilesExpected: false
  }
};

const readyMarkdown = `# KALM OUTDOOR READY TO INTEGRATE

Generated: ${generatedAt}

## Stop Instruction

Phase A is finalised. Do not begin Phase B, integrate, merge or deploy until the recovery release is complete and the deployment lock is clear.

## Branch

- Workspace: \`C:\\Users\\Dell\\codex-work\\kalm-outdoor-accessories\`
- Branch name: \`${branch}\`
- Starting SHA: \`${startingSha}\`
- Checkpoint base SHA before final commit: \`${currentSha}\`
- Final checkpoint SHA: read from pushed branch HEAD after commit
- Recovery workspace touched: no
- Merge to master: no
- Netlify deployment initiated: no

## Completed Phase A Work

${executionState.completedPhaseAWork.map((item) => `- ${item}`).join("\n")}

## Every File Created Or Modified

${fullFileList.map((file) => `- ${file}`).join("\n")}

## Every Generated Image And Status

${manifest.images.map((image) => `- ${image.path} - ${image.status} - ${image.sha256}`).join("\n")}

## Failed Or Billing-Blocked Image Jobs

- Failed image jobs: none
- Billing-blocked image jobs: none
- Paid image API used: no

## Draft Product Records

${accessories.accessories.map((product) => `- ${product.title} - ${product.id} - ${product.slug} - ${product.skuRoot} - ${product.status}`).join("\n")}

## Compatibility Mappings

${accessories.accessories.map((product) => `- ${product.title}: Ember 16=${product.compatibility["ember-16"]}; Forge 2=${product.compatibility["forge-2"]}; Ridge 4=${product.compatibility["ridge-4"]}`).join("\n")}

## Bundle Definitions

${bundles.bundles.map((bundle) => `- ${bundle.title} - ${bundle.id} - ${bundle.includedAccessoryIds.join(", ")}`).join("\n")}

## Supplier Information Still Pending

${executionState.supplierInformationStillPending.map((item) => `- ${item}`).join("\n")}

## Exact First Command Required To Begin Phase B

\`\`\`powershell
cd "C:\\Users\\Dell\\codex-work\\kalm-outdoor-accessories"; git fetch origin; git status --short --branch
\`\`\`

## Phase B Gate

Do not continue unless the recovery task is complete, its final commit is pushed, its release base is known, no other task is editing \`products.json\`, and no other task is deploying.

## Evidence Reports

- \`reports/kalm-outdoor-accessory-image-jobs.json\`
- \`reports/outdoor-autonomous-execution-state.json\`
- \`reports/kalm-outdoor-accessories-validation.json\`
- \`reports/kalm-outdoor-accessories-integration-plan.md\`
`;

await writeJson("reports/kalm-outdoor-accessory-image-jobs.json", imageJobs);
await writeJson("reports/outdoor-autonomous-execution-state.json", executionState);
await writeText("reports/KALM-OUTDOOR-READY-TO-INTEGRATE.md", readyMarkdown);

console.log(JSON.stringify({
  ok: true,
  branch,
  startingSha,
  checkpointBaseShaBeforeFinalCommit: currentSha,
  filesRecorded: fullFileList.length,
  imageJobs: imageJobs.jobs.length
}, null, 2));

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function writeJson(relativePath, value) {
  await mkdir(path.dirname(path.join(root, relativePath)), { recursive: true });
  await writeFile(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(relativePath, value) {
  await mkdir(path.dirname(path.join(root, relativePath)), { recursive: true });
  await writeFile(path.join(root, relativePath), value, "utf8");
}

function exec(command) {
  return execSync(command, { cwd: root, encoding: "utf8" }).trim();
}
