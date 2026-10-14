# 버디아 로컬 — Toss Local Discovery

Independent Toss WebView miniapp. Source is under this directory, separate from Birdiaconia OS (Next.js) and B2B commercial PR #34.

## Develop
```sh
cd apps/toss-local-discovery
npm install
npm run test
npm run dev
npm run build
```
Replace `appName` in `apps-in-toss.config.ts` with the exact registered name, validate in Toss sandbox and run `npm run bundle:ait`. The app is **not deployed, approved, or registered yet**.

`src/data/demo.ts` offers are fictional, visible only in Vite development. `src/data/published-offers.json` is empty, so production has no offers until validated partners and terms are inserted. No real booking, discount, payment, account, or CRM exists yet.

See `docs/toss/Toss_Local_Discovery_Product_v0.1.md` for consumer journey, revenue and release gates.
