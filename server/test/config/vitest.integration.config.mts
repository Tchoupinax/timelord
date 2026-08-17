import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: false,
  oxc: false,
  test: {
    globals: true,
    sequence: {
      hooks: "list",
    },
    environment: "node",
    hookTimeout: 30000,
    testTimeout: 30000,
    // globalSetup: [`${process.cwd()}/test/utils/global-setup.mts`],
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
