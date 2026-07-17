# Paystack Live Readiness

Status: **BLOCKED**

Reason: **No verified KALM corporate settlement bank account is connected.**

The missing settlement account does not block the draft test-mode code, but it blocks live keys, real collection, payout activation and production publication.

| Required live gate | Status |
|---|---|
| Paystack registered business profile complete | Pending verification |
| KALM corporate bank account exists | Blocked / unverified |
| Account name matches KALM COLLECTIVE (PTY) LTD | Pending verification |
| Bank confirmation letter available | Pending verification |
| Paystack compliance approved | Pending verification |
| Live keys issued | Not requested |
| Payout account verified | Blocked |
| Legal company details verified | Pending verification |
| Accountant approves settlement flow | Pending verification |
| Production transaction and refund smoke tests approved | Not started |
| Munya gives written live-mode approval | Not requested |

Live mode must require all of the above plus `PAYSTACK_MODE=live`, `PAYSTACK_LIVE_ENABLED=true`, verified live keys and a final production smoke test. This branch does not activate any of them.
