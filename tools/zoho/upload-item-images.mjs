import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const defaultMap = "C:/CodexWork/kalm-ops-intranet-thumbnail-preview/src/data/inventoryImageMap.ts";
const defaultThumbRoot = "C:/CodexWork/kalm-ops-intranet-thumbnail-preview/public";
const defaultResults = path.join(root, "reports/KALM-IMAGE-SYSTEM/ZOHO-IMAGE-UPLOAD-RESULTS.json");
const defaultAudit = path.join(root, "reports/KALM-IMAGE-SYSTEM/ZOHO-IMAGE-UPLOAD-AUDIT.md");

const protectedFields = [
  "name",
  "item_name",
  "sku",
  "rate",
  "purchase_rate",
  "initial_stock",
  "initial_stock_rate",
  "stock_on_hand",
  "available_stock",
  "actual_available_stock",
  "reorder_level",
  "status",
  "account_id",
  "purchase_account_id",
  "inventory_account_id",
  "tax_id",
  "tax_percentage",
  "is_taxable",
  "warehouse_id",
  "warehouses",
];

function arg(name, fallback = "") {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1] || fallback;
}

function has(name) {
  return process.argv.includes(name);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function loadEnvFromJson(file) {
  if (!file) return;
  const raw = readJson(file);
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim()) process.env[key] = value.trim();
  }
}

function loadEnvFromFile(file) {
  if (!file) return;
  const source = fs.readFileSync(file, "utf8");
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    const raw = rest.join("=").trim();
    if (!key.trim() || !raw) continue;
    let value = raw;
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      try {
        value = JSON.parse(raw);
      } catch {
        value = raw.slice(1, -1);
      }
    }
    process.env[key.trim()] = String(value).trim();
  }
}

function env(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return "";
}

function isMaskedSecret(value) {
  return typeof value === "string" && /^\*{8,}[^*]{0,8}$/.test(value);
}

function parseMap(file) {
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/export const inventoryImageMap = ([\s\S]*?) as const;/);
  if (!match) throw new Error(`Could not parse inventoryImageMap from ${file}`);
  return Object.entries(JSON.parse(match[1])).map(([sku, value]) => ({ sku, ...value }));
}

function imagePath(thumbnailRoot, thumbnail) {
  const rel = thumbnail.replace(/^\//, "").replace(/\//g, path.sep);
  return path.join(thumbnailRoot, rel);
}

function fileHash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").toUpperCase();
}

function accountBase() {
  const region = env("ZOHO_INVENTORY_DC_REGION", "ZOHO_DC_REGION") || "com";
  const domains = {
    com: "accounts.zoho.com",
    eu: "accounts.zoho.eu",
    in: "accounts.zoho.in",
    "com.au": "accounts.zoho.com.au",
    ca: "accounts.zohocloud.ca",
    jp: "accounts.zoho.jp",
    "com.cn": "accounts.zoho.com.cn",
    sa: "accounts.zoho.sa",
  };
  return `https://${domains[region] || domains.com}`;
}

function apiBase(apiDomain = "") {
  if (apiDomain) return `${apiDomain.replace(/\/$/, "")}/inventory/v1`;
  const region = env("ZOHO_INVENTORY_DC_REGION", "ZOHO_DC_REGION") || "com";
  const domains = {
    com: "zohoapis.com",
    eu: "zohoapis.eu",
    in: "zohoapis.in",
    "com.au": "zohoapis.com.au",
    ca: "zohoapis.ca",
    jp: "zohoapis.jp",
    "com.cn": "zohoapis.com.cn",
    sa: "zohoapis.sa",
  };
  return `https://www.${domains[region] || domains.com}/inventory/v1`;
}

function decryptBundle(encrypted) {
  const keySecret = env("ZOHO_INVENTORY_ACCESS_TOKEN_ENCRYPTION_KEY", "ZOHO_ACCESS_TOKEN_ENCRYPTION_KEY");
  if (!encrypted || !keySecret) throw new Error("Zoho encrypted token bundle or encryption key is missing.");
  const [iv, tag, payload] = encrypted.split(".");
  if (!iv || !tag || !payload) throw new Error("Zoho token bundle is not in the expected encrypted format.");
  const key = crypto.createHash("sha256").update(keySecret).digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(Buffer.concat([
    decipher.update(Buffer.from(payload, "base64url")),
    decipher.final(),
  ]).toString("utf8"));
}

async function refreshToken(bundle) {
  if (bundle.accessToken && bundle.expiresAt && bundle.expiresAt > Date.now() + 60_000) return bundle;
  if (!bundle.refreshToken) throw new Error("Zoho refresh token is missing.");
  const body = new URLSearchParams({
    refresh_token: bundle.refreshToken,
    client_id: env("ZOHO_INVENTORY_CLIENT_ID", "ZOHO_CLIENT_ID"),
    client_secret: env("ZOHO_INVENTORY_CLIENT_SECRET", "ZOHO_CLIENT_SECRET"),
    grant_type: "refresh_token",
  });
  const response = await fetch(`${accountBase()}/oauth/v2/token`, { method: "POST", body });
  const json = await response.json();
  if (!response.ok || json.error) {
    throw new Error(String(json.error_description || json.error || `Zoho refresh failed with HTTP ${response.status}`));
  }
  return {
    ...bundle,
    accessToken: String(json.access_token || ""),
    expiresAt: Date.now() + Number(json.expires_in || 3600) * 1000,
    apiDomain: String(json.api_domain || bundle.apiDomain || ""),
    tokenType: String(json.token_type || bundle.tokenType || "Bearer"),
    scope: String(json.scope || bundle.scope || ""),
  };
}

async function zohoRequest(bundle, route, options = {}) {
  const orgId = env("ZOHO_INVENTORY_ORGANIZATION_ID", "ZOHO_ORGANIZATION_ID");
  if (!orgId) throw new Error("ZOHO_INVENTORY_ORGANIZATION_ID is missing.");
  const url = new URL(`${apiBase(bundle.apiDomain)}${route}`);
  url.searchParams.set("organization_id", orgId);
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Zoho-oauthtoken ${bundle.accessToken}`,
      ...(options.headers || {}),
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.arrayBuffer();
  if (!response.ok || (payload && typeof payload === "object" && !("byteLength" in payload) && Number(payload.code || 0) !== 0)) {
    const message = payload && typeof payload === "object" && !("byteLength" in payload)
      ? String(payload.message || payload.error || `HTTP ${response.status}`)
      : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

function pickProtected(item) {
  const out = {};
  for (const field of protectedFields) out[field] = item?.[field] ?? null;
  return out;
}

function diffProtected(before, after) {
  return protectedFields.filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]));
}

function choosePilot(records) {
  const firstKs = records.find((r) => r.productSku === "KS-ARCH-P030") || records[0];
  const firstColour = records.find((r) => r.colour && r.variantSku !== firstKs.variantSku && r.productSku !== firstKs.productSku) || records.find((r) => r.variantSku !== firstKs.variantSku);
  const signature = records.find((r) => /\b(signature|oversized|tee|t-shirt|tshirt)\b/i.test([r.productId, r.alt, r.productSku, r.variantSku, r.thumbnail].join(" ")));
  return [signature, firstKs, firstColour].filter(Boolean).filter((r, i, a) => a.findIndex((x) => x.zohoItemId === r.zohoItemId) === i);
}

async function main() {
  const mode = has("--apply") ? "apply" : has("--verify") ? "verify" : "dry-run";
  const mappingFile = arg("--mapping", defaultMap);
  const thumbnailRoot = arg("--thumbnail-root", defaultThumbRoot);
  const envJson = arg("--netlify-env-json", "");
  const envFile = arg("--env-file", "");
  const resultsPath = arg("--results", defaultResults);
  const auditPath = arg("--audit", defaultAudit);
  const limit = Number(arg("--limit", "0"));
  loadEnvFromJson(envJson);
  loadEnvFromFile(envFile);

  const allRecords = parseMap(mappingFile).filter((r) => r.confidence === "VERIFIED" && r.zohoItemId);
  let records = has("--pilot") ? choosePilot(allRecords) : allRecords;
  if (limit > 0) records = records.slice(0, limit);

  const invalidFiles = records
    .map((r) => ({ ...r, localImagePath: imagePath(thumbnailRoot, r.thumbnail) }))
    .filter((r) => !fs.existsSync(r.localImagePath));

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    pilot: has("--pilot"),
    mappingFile,
    thumbnailRoot,
    eligibleVerifiedMappings: allRecords.length,
    selectedMappings: records.length,
    uniqueZohoItems: new Set(allRecords.map((r) => r.zohoItemId)).size,
    signatureTeeMappingPresent: Boolean(allRecords.find((r) => /\b(signature|oversized|tee|t-shirt|tshirt)\b/i.test([r.productId, r.alt, r.productSku, r.variantSku, r.thumbnail].join(" ")))),
    invalidFiles: invalidFiles.map((r) => ({ sku: r.variantSku || r.sku, thumbnail: r.thumbnail })),
    uploads: [],
    summary: {
      reviewed: 0,
      uploaded: 0,
      verified: 0,
      skipped: 0,
      failed: 0,
      protectedFieldChanges: 0,
    },
    blockers: [],
  };

  if (invalidFiles.length) report.blockers.push("One or more mapped thumbnail files are missing.");

  const authValues = {
    tokenBundle: env("ZOHO_INVENTORY_TOKEN_BUNDLE"),
    encryptionKey: env("ZOHO_INVENTORY_ACCESS_TOKEN_ENCRYPTION_KEY", "ZOHO_ACCESS_TOKEN_ENCRYPTION_KEY"),
    clientId: env("ZOHO_INVENTORY_CLIENT_ID", "ZOHO_CLIENT_ID"),
    clientSecret: env("ZOHO_INVENTORY_CLIENT_SECRET", "ZOHO_CLIENT_SECRET"),
    organizationId: env("ZOHO_INVENTORY_ORGANIZATION_ID", "ZOHO_ORGANIZATION_ID"),
    region: env("ZOHO_INVENTORY_DC_REGION", "ZOHO_DC_REGION"),
  };
  const maskedAuthKeys = Object.entries(authValues)
    .filter(([, value]) => isMaskedSecret(value))
    .map(([key]) => key);
  if (maskedAuthKeys.length) {
    report.blockers.push(`Netlify returned masked secret placeholders for required Zoho runtime values: ${maskedAuthKeys.join(", ")}.`);
  }

  let bundle = null;
  if (!report.blockers.length) {
    try {
      bundle = await refreshToken(decryptBundle(env("ZOHO_INVENTORY_TOKEN_BUNDLE")));
      if (!/ZohoInventory\.items\.CREATE/.test(bundle.scope || "") && mode === "apply") {
        report.blockers.push("Current Zoho Inventory OAuth bundle does not include ZohoInventory.items.CREATE.");
      }
    } catch (error) {
      report.blockers.push(`Zoho API authentication failed before item-image upload: ${String(error.message || error)}`);
    }
  }

  if (!report.blockers.length) {
    for (const record of records) {
      const localImagePath = imagePath(thumbnailRoot, record.thumbnail);
      const row = {
        sku: record.variantSku || record.sku,
        productSku: record.productSku,
        colour: record.colour,
        zohoItemId: record.zohoItemId,
        thumbnail: record.thumbnail,
        localImagePath,
        imageSha256: fileHash(localImagePath),
        status: "pending",
        protectedFieldChanges: [],
      };
      try {
        const beforeJson = await zohoRequest(bundle, `/items/${record.zohoItemId}`);
        const before = pickProtected(beforeJson.item || beforeJson);
        report.summary.reviewed += 1;

        if (mode === "dry-run") {
          row.status = "dry_run_ok";
          report.summary.skipped += 1;
        } else {
          if (mode === "apply") {
            const form = new FormData();
            const bytes = fs.readFileSync(localImagePath);
            form.append("image", new Blob([bytes], { type: "image/webp" }), path.basename(localImagePath));
            await zohoRequest(bundle, `/items/${record.zohoItemId}/image`, { method: "POST", body: form });
            report.summary.uploaded += 1;
          }

          const imageBytes = await zohoRequest(bundle, `/items/${record.zohoItemId}/image`);
          if (imageBytes.byteLength > 0) {
            row.status = mode === "apply" ? "uploaded_and_verified" : "verified_existing_image";
            report.summary.verified += 1;
          } else {
            throw new Error("Zoho image verification returned an empty response.");
          }
        }

        const afterJson = await zohoRequest(bundle, `/items/${record.zohoItemId}`);
        const after = pickProtected(afterJson.item || afterJson);
        row.protectedFieldChanges = diffProtected(before, after);
        report.summary.protectedFieldChanges += row.protectedFieldChanges.length;
        if (row.protectedFieldChanges.length) row.status = "failed_protected_field_changed";
      } catch (error) {
        row.status = "failed";
        row.error = String(error.message || error);
        report.summary.failed += 1;
      }
      report.uploads.push(row);
    }
  }

  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  fs.writeFileSync(resultsPath, `${JSON.stringify(report, null, 2)}\n`);
  const audit = [
    "# Zoho Item Image Upload Audit",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${mode}`,
    `Pilot: ${report.pilot}`,
    `Eligible VERIFIED mappings: ${report.eligibleVerifiedMappings}`,
    `Selected mappings: ${report.selectedMappings}`,
    `Unique Zoho items: ${report.uniqueZohoItems}`,
    `Signature Tee verified mapping present: ${report.signatureTeeMappingPresent}`,
    "",
    "## Summary",
    "",
    `- Reviewed: ${report.summary.reviewed}`,
    `- Uploaded: ${report.summary.uploaded}`,
    `- Verified: ${report.summary.verified}`,
    `- Skipped: ${report.summary.skipped}`,
    `- Failed: ${report.summary.failed}`,
    `- Protected-field changes: ${report.summary.protectedFieldChanges}`,
    "",
    "## Blockers",
    "",
    ...(report.blockers.length ? report.blockers.map((b) => `- ${b}`) : ["- None"]),
  ].join("\n");
  fs.writeFileSync(auditPath, `${audit}\n`);
  console.log(JSON.stringify({
    mode: report.mode,
    pilot: report.pilot,
    eligibleVerifiedMappings: report.eligibleVerifiedMappings,
    selectedMappings: report.selectedMappings,
    uploaded: report.summary.uploaded,
    verified: report.summary.verified,
    failed: report.summary.failed,
    protectedFieldChanges: report.summary.protectedFieldChanges,
    blockers: report.blockers,
    resultsPath,
    auditPath,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
