import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiDir = path.join(root, "ui");
const nuxtBin = path.join(uiDir, "node_modules", ".bin", "nuxt");

const proxy = spawn("node", [path.join(root, "scripts/oauth-callback-proxy.mjs")], {
  stdio: "inherit",
  env: process.env,
});

const nuxt = spawn(nuxtBin, ["dev"], {
  cwd: uiDir,
  stdio: "inherit",
  env: process.env,
});

function shutdown() {
  proxy.kill("SIGTERM");
  nuxt.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

proxy.on("exit", code => {
  if (code && code !== 0) {
    console.error(`OAuth callback proxy exited with code ${code}`);
  }
});

nuxt.on("exit", code => {
  proxy.kill("SIGTERM");
  process.exit(code ?? 0);
});
