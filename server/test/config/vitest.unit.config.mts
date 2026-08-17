import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

import { e2eEnv } from "./e2e-env.mts";

export default defineConfig({
  esbuild: false,
  oxc: false,
  test: {
    env: e2eEnv,
    globals: true,
    sequence: {
      hooks: "list",
    },
    environment: "node",
    hookTimeout: 30000,
    testTimeout: 30000,
    include: ["src/**/*.spec.mts"],
    reporters: ["default"],
  },
  plugins: [
    // This is required to build the test files with SWC
    swc.vite({
      // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
      module: { type: "es6" },
    }),
  ],
});
