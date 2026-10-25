import { defineConfig } from "@apps-in-toss/web-framework/config";

// 'birdiaconia' is a provisional appName. Match the actual registered appName in Toss console.
export default defineConfig({
  appName: "birdiaconia",
  brand: {
    primaryColor: "#607C4C",
  },
  webView: {},
  permissions: [],
  webBundleDir: "dist",
});
