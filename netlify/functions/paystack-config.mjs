import { getRuntimeConfig, json, publicRuntimeConfig } from "./_shared/paystack-core.mjs";

export default async (request, context) => json(publicRuntimeConfig(getRuntimeConfig(context, request)));

export const config = {
  path: "/api/payments/paystack/config",
  method: ["GET"]
};
