import { defineConfig } from "@apps-in-toss/web-framework/config";

/** Replace this local placeholder with the exact console-registered appName before publishing. */
export default defineConfig({
  appName: "birdiaconia-local-demo",
  brand: { primaryColor: "#246B54" },
  webView: {},
  permissions: [],
  webBundleDir: "dist",
});
