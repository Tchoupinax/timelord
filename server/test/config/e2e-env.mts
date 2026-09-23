import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export const E2E_PORT = 18888;

export const E2E_SSH_KEYS_REPOSITORY = path.join(
  serverRoot,
  "test/fixtures/ssh-keys",
);

export const e2eEnv: Record<string, string> = {
  DATABASE_URL: "postgres://postgres:mysecret@localhost:5438/postgres",
  DISABLE_AUTHENTICATION: "false",
  GIT_CONFIGS_REPOSITORY: path.join(serverRoot, "test/fixtures/git-configs"),
  LOG_LEVEL: "error",
  NODE_ENV: "test",
  OIDC_CONFIGURATION_URL: "https://example.com/.well-known/openid-configuration",
  OIDC_PROVIDER_IMAGE: "https://example.com/logo.png",
  PORT: String(E2E_PORT),
  POSTGRES_DATABASE: "postgres",
  POSTGRES_HOSTNAME: "localhost",
  POSTGRES_PASSWORD: "mysecret",
  POSTGRES_PORT: "5438",
  POSTGRES_USERNAME: "postgres",
  SSH_KEYS_REPOSITORY: E2E_SSH_KEYS_REPOSITORY,
};
