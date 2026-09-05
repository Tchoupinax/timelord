import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export const E2E_PORT = 18888;

export const e2eEnv: Record<string, string> = {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://postgres:mysecret@localhost:5438/postgres",
  POSTGRES_USERNAME: "postgres",
  POSTGRES_PASSWORD: "mysecret",
  POSTGRES_HOSTNAME: "localhost",
  POSTGRES_PORT: "5438",
  POSTGRES_DATABASE: "postgres",
  DISABLE_AUTHENTICATION: "false",
  GIT_CONFIGS_REPOSITORY: path.join(serverRoot, "test/fixtures/git-configs"),
  LOG_LEVEL: "error",
  OIDC_PROVIDER_IMAGE: "https://example.com/logo.png",
  OIDC_CONFIGURATION_URL: "https://example.com/.well-known/openid-configuration",
  PORT: String(E2E_PORT),
};
