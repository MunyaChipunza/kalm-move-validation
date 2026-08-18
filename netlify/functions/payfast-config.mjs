import { getPayFastConfig, payFastGatewayState } from "./_shared/payfast-core.mjs";
import { publicCommerceConfiguration } from "./_shared/commerce-core.mjs";
import { json, safeError } from "./_shared/http.mjs";

export const config = { path: "/api/payments/payfast/config", method: ["GET"] };

export default async function payfastConfig() {
  try {
    const runtime = getPayFastConfig();
    return json({ gateway: "payfast", available: runtime.enabled && ["test", "live"].includes(payFastGatewayState(runtime)), state: payFastGatewayState(runtime), ...publicCommerceConfiguration(runtime) });
  } catch (error) { return safeError(error); }
}
