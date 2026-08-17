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
    globalSetup: [`${process.cwd()}/test/utils/global-setup.mts`],
    hookTimeout: 30_000,
    testTimeout: 30_000,
    setupFiles: [`${process.cwd()}/test/utils/setup-files.mts`],
    include: ["test/integration/**/*.spec.mts"],
    reporters: [
      [
        "default",
        {
          summary: false,
        },
      ],
    ],
    maxConcurrency: 1,
    maxWorkers: 1,
  },
  plugins: [swc.vite()],
});
