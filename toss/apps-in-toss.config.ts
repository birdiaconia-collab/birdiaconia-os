import { defineConfig } from "@apps-in-toss/web-framework/config";

// This is only a standalone preview. Never guess the already-registered Toss appName.
// Set EXISTING_TOSS_APP_NAME to the verified existing Mini App ID before an SDK build.
const appName = process.env.EXISTING_TOSS_APP_NAME;
if (!appName) {
  throw new Error(
    "Existing Toss Mini App ID is unknown. Set EXISTING_TOSS_APP_NAME only after confirming it in the existing app's developer console."
  );
}

export default defineConfig({
  appName,
  brand: { primaryColor: "#607C4C" },
  webView: {},
  permissions: [],
  webBundleDir: "dist",
});
