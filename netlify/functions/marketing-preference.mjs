import { setMarketingPreference } from "./_shared/commerce-store.mjs";
import { PayFastError } from "./_shared/payfast-core.mjs";
import { json, readJson, safeError } from "./_shared/http.mjs";

export const config = { path: "/api/marketing/preference", method: ["POST"] };

// This endpoint records a separate, voluntary marketing preference. It is not
// used for transactional order notices and accepts no order or payment data.
export default async function marketingPreference(request) {
  try {
    const body = await readJson(request);
    const action = String(body.action || "").trim().toLowerCase();
    if (!["subscribe", "unsubscribe"].includes(action)) {
      throw new PayFastError(400, "invalid_preference_action", "Preference action is invalid.");
    }
    if (action === "subscribe" && body.consent !== true) {
      throw new PayFastError(400, "marketing_consent_required", "Marketing consent is required.");
    }
    const result = await setMarketingPreference({
      email: body.email,
      subscribed: action === "subscribe",
      source: body.source
    });
    return json({ ok: true, subscribed: result.subscribed });
  } catch (error) {
    return safeError(error);
  }
}
