import { PayFastError } from "./_shared/payfast-core.mjs";
import { reconciliationSnapshot } from "./_shared/commerce-store.mjs";
import { requireOperationsAccess } from "./_shared/operations-auth.mjs";
import { json, safeError } from "./_shared/http.mjs";

export const config = { path: "/api/internal/payments/payfast/reconciliation", method: ["GET"] };

export default async function payfastReconciliation(request) {
  try {
    requireOperationsAccess(request);
    return json({ gateway: "payfast", ...(await reconciliationSnapshot()) });
  } catch (error) { return safeError(error); }
}
