# Toss Local Discovery / Birdiaconia consumer app v0.1

## Objective

Build a consumer-focused **local experience and benefits discovery miniapp**, not another OS administration interface or business-plan landing page. Keep PR #34 for operator/B2B use. This branch is fully independent under `apps/toss-local-discovery`.

## Consumer journey

Toss entry → experience discovery/search → region/category/companion filters → experience detail → save locally/share → return to saved collection.

- WebView SDK 3.x `@apps-in-toss/web-framework`, `apps-in-toss.config.ts`, static Vite bundle and `ait build`.
- Toss TDS `Button` for the primary action; remaining UI needs complete TDS and device verification prior to review.
- Analytics `Analytics.click`/`Analytics.screen` opt-in by build environment, disabled by default. Do not include personal data in analytics.
- Share with `share`; `getTossShareLink` only with an actual registered appName.
- Use manual region choice to avoid location permission. No login, customer data transmission or backend required at this stage.

## Current state and truth-in-advertising

`published-offers.json` intentionally contains `[]`. The six fictional demo cards appear ONLY under `import.meta.env.DEV`. Public build displays an empty state until actual suppliers are approved. Neither demo cards nor the released build claim a real reservation, discount or payment is available. Favorites are localStorage-only, not bookings or inquiries.

## Commercial revenue strategy

| Revenue source | Preconditions | Recognition |
| --- | --- | --- |
| Experience/service booking brokerage | Supplier contract, legal eligibility, live capacity, price, cancellation terms, compliant checkout/booking APIs | Contractual commission on verified completed transaction; GMV not equal to company revenue |
| Self-operated experiences | Actual deliverable, operator insurance, permitted category and refund terms | Own-service revenue with direct costs and partner payout separated |
| Sponsored discovery placements | Advertising policy approval, advertising identification, no fabricated discounts | Contractual content/placement revenue |
| In-app ads | Approved inventory and AIT ad integration with UX testing | Platform-verified ad proceeds |

Example (hypothetical only): 100 completed bookings × KRW 70,000 basket × 10% commission = KRW 700,000 commission revenue before expenses and refund adjustments, while KRW 7 million is GMV.

## Publish gate

An item is public only if it has verified `partnerId`, `partnerName`, approved future time window, `termsReviewed`, `inventoryConfirmed`, recognized region/category, and explicit `verification:"published"`. Duplicate entries are dropped. This is client-side defense in the current prototype. **Production requires authenticated server-side partner approvals and booking state verification.**

## Phase gates

1. **Demand**: Search/detail/save/share; validate value with real visitors, not fabricated inventory.
2. **Supply**: 2-3 real partners; 3-5 verified items with independently confirmed description, operational responsibility, accessibility, price, date, capacity, safety, cancellations and support contact. Publish only after approval.
3. **Transaction**: AIT payment/commerce policy review, separate authorized commerce/payment provider provisioning, customer consent and applicable travel/e-commerce registrations, server-owned order lifecycle, idempotent webhooks and refunds.
4. **Repeat**: Consent-based notifications, favorites account sync, event analytics, sponsorship or ad approval, retention evaluation.

## Implementation and access limits

- The actual appName `birdiaconia-local-demo` in `apps-in-toss.config.ts` is a **placeholder**. Update to the console-registered exact appName before bundling or sharing a link.
- Use `npm install && npm run test && npm run build && npm run bundle:ait` when dependencies and credentials are available.
- This workspace currently cannot fetch npm packages (DNS EAI_AGAIN). Full SDK/typecheck/Vite and .ait build **have not been verified**; do not merge or release on this basis.
- No payment gateway, backend, partner onboarding, real users, Toss sandbox signing or production release are represented as complete.
- Keep personal health/case-management data out of GitHub/public catalog.

## Operating Core

The shared object chain is `PARTNER → OFFER → INTEREST → ORDER → PAYMENT → SETTLEMENT`. Only public approved `OFFER` data is served to Toss; private commercial transactions remain server-side. Do not mix volunteer hours, donations, public grants, cost reimbursements, sponsorship or retail commissions into a single revenue field.

## Documentation references

- https://developers-apps-in-toss.toss.im/
- https://github.com/toss/apps-in-toss-examples/blob/main/common-apis/apps-in-toss.config.ts
- https://github.com/toss/apps-in-toss-examples/blob/main/growth/src/App.tsx
