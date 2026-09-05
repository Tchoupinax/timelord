import { type ChildProcess, execSync, spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

import axios from "axios";

import { E2E_PORT, e2eEnv } from "../config/e2e-env.mts";

const healthUrl = `http://127.0.0.1:${E2E_PORT}/health`;

async function waitForPostgres(maxAttempts = 30): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      execSync(
        "docker compose -f test/infra/docker-compose.yml exec -T postgres pg_isready -U postgres",
        { stdio: "pipe" },
      );
      return;
    } catch {
      await sleep(1_000);
    }
  }

  throw new Error("Postgres did not become ready in time");
}

async function waitForHealth(maxAttempts = 30): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(healthUrl, { timeout: 1_000 });
      if (response.status === 200) {
        return;
      }
    } catch {
      await sleep(1_000);
    }
  }

  throw new Error(`Server did not become healthy at ${healthUrl}`);
}

export default async function globalSetup(): Promise<() => Promise<void>> {
  execSync("docker compose -f test/infra/docker-compose.yml up -d", {
    stdio: "inherit",
  });

  await waitForPostgres();

  execSync("npx prisma generate", {
    env: {
      ...process.env,
      ...e2eEnv,
    },
    stdio: "inherit",
  });

  execSync("npx prisma migrate deploy", {
    env: {
      ...process.env,
      ...e2eEnv,
    },
    stdio: "inherit",
  });

  const server = spawn("npx", ["tsx", "src/index.mts"], {
    env: {
      ...process.env,
      ...e2eEnv,
    },
    stdio: ["ignore", "pipe", "pipe"],
  }) as ChildProcess;

  server.stdout?.on("data", chunk => {
    process.stdout.write(`[e2e-server] ${String(chunk)}`);
  });
  server.stderr?.on("data", chunk => {
    process.stderr.write(`[e2e-server] ${String(chunk)}`);
  });

  await waitForHealth();

  return async () => {
    server.kill("SIGTERM");

    for (let attempt = 0; attempt < 10; attempt++) {
      if (server.exitCode !== null) {
        return;
      }

      await sleep(200);
    }

    server.kill("SIGKILL");
  };
}
