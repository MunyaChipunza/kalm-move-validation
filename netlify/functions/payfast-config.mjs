import { getPayFastConfig, payFastGatewayState } from "./_shared/payfast-core.mjs";
import { json, safeError } from "./_shared/http.mjs";

export const config = { path: "/api/payments/payfast/config" };

export default async function handler() {
  try {
    const runtime = getPayFastConfig();
    const state = payFastGatewayState(runtime);
    return json({ available: runtime.enabled && (state === "test" || state === "live"), state });
  } catch (error) {
    return safeError(error);
  }
}
