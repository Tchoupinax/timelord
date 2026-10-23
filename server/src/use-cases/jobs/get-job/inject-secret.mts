import vault from "node-vault";

import { logger } from "#src/logger.mts";
import { prisma } from "#src/prisma-client.mts";
import { getRobotStore } from "#src/store.mts";
import { env } from "#src/tools/env.mts";

const options = {
  apiVersion: "v1",
  endpoint: env.VAULT_ADDR,
  token: env.VAULT_TOKEN,
};

const vaultRetryDelayMs = 30_000;
const unreachableCodes = new Set([
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "ETIMEDOUT",
]);

// A dead Vault is expected in local and e2e runs. Remember it briefly so each
// log line does not open a socket and dump the Axios error, which includes the
// Vault token.
let vaultUnreachableUntil = 0;

function vaultReadsPaused(): boolean {
  return Date.now() < vaultUnreachableUntil;
}

function errorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object" || !("code" in err)) {
    return undefined;
  }
  return typeof err.code === "string" ? err.code : undefined;
}

function isVaultUnreachable(err: unknown): boolean {
  const code = errorCode(err);
  if (code !== undefined && unreachableCodes.has(code)) {
    return true;
  }
  if (err instanceof AggregateError) {
    return err.errors.some(cause => isVaultUnreachable(cause));
  }
  if (err instanceof Error && err.cause !== undefined) {
    return isVaultUnreachable(err.cause);
  }
  return false;
}

function logVaultFailure(err: unknown) {
  if (isVaultUnreachable(err)) {
    const alreadyPaused = vaultReadsPaused();
    vaultUnreachableUntil = Date.now() + vaultRetryDelayMs;
    if (alreadyPaused) {
      return;
    }
    logger.warn(
      {
        err: err instanceof Error ? err.message : String(err),
        vault: env.VAULT_ADDR,
      },
      "Vault is unreachable, falling back to database secrets",
    );
    return;
  }

  logger.error(
    { err: err instanceof Error ? err.message : String(err) },
    "Vault request failed, falling back to database secrets",
  );
}

async function readVaultData(): Promise<Record<string, string> | undefined> {
  if (!env.VAULT_ADDR || !env.VAULT_TOKEN || vaultReadsPaused()) {
    return undefined;
  }

  try {
    const vaultClient = vault(options);
    const data: Record<string, string> | undefined = await vaultClient
      .read(env.VAULT_PATH)
      .then(
        (body: { data?: { data?: Record<string, string> } }) => body.data?.data,
      );
    vaultUnreachableUntil = 0;
    return data ?? {};
  } catch (err) {
    logVaultFailure(err);
    return undefined;
  }
}

export function injectSecret(fileWithoutSecrets: string): Promise<string> {
  logger.info("Inject secret");

  const secretRegex = /\$\$\{.*\}/g;

  return asyncReplace(fileWithoutSecrets, secretRegex, replacementFunction);
}

export async function hideSecret(
  lineWithPotentialSecret: string,
): Promise<string> {
  logger.info("Redacting secret from the line if it exists");

  const secret = await findSecretInLine(lineWithPotentialSecret);
  if (secret?.name) {
    return lineWithPotentialSecret.replace(
      secret.value,
      `$$$\{${secret.name} <hidden>}`,
    );
  }

  return lineWithPotentialSecret;
}

async function replacementFunction(match: string) {
  logger.info("Replacing all secrets");

  const store = getRobotStore();

  const secretKey = match.replace("$${", "").replace("}", "");
  logger.info("Getting secret from Vault is accepted");
  const secrets = await readVaultData();
  const secret = secrets?.[secretKey] ?? null;

  if (secret) {
    logger.info("Secret found in Vault");
    return secret;
  }

  const databaseSecret = await prisma.secret.findFirst({
    where: {
      name: secretKey,
      userId: store.userId,
    },
  });

  if (!databaseSecret) {
    throw new Error(`Secret ${secretKey} not found.`);
  }

  await prisma.secret.update({
    where: {
      id: databaseSecret.id,
    },
    data: {
      lastRead: new Date(),
    },
  });

  logger.info("Secret found in Database");

  return databaseSecret.value;
}

async function asyncReplace(
  text: string,
  regex: RegExp,
  asyncFn: (_: string) => Promise<string>,
) {
  const matches = [...text.matchAll(regex)];

  const replacements = matches.map(async match => {
    const replacement = await asyncFn(match[0]);
    return {
      start: match.index,
      end: match.index + match[0].length,
      replacement,
    };
  });

  const resolvedReplacements = await Promise.all(replacements);

  let result = text;
  for (const { start, end, replacement } of resolvedReplacements.reverse()) {
    result = result.slice(0, start) + replacement + result.slice(end);
  }

  return result;
}

async function findSecretInLine(
  value: string,
): Promise<{ name: string; value: string } | null> {
  let secret;

  logger.info("findSecretInLine Vault accepted");
  const vaultSecrets = await readVaultData();
  if (vaultSecrets) {
    const secretName = Object.keys(vaultSecrets).find(name => {
      const secretValue = vaultSecrets[name];
      return secretValue !== undefined && secretValue.length > 0 && value.includes(secretValue);
    });
    const secretValue = secretName ? vaultSecrets[secretName] : undefined;

    if (secretName && secretValue) {
      return {
        name: secretName,
        value: secretValue,
      };
    }
  }

  if (!secret) {
    const secrets = await prisma.secret.findMany({});
    secret = secrets.filter(s => value.includes(s.value))[0];

    if (secret) {
      await prisma.secret.update({
        where: {
          id: secret.id,
        },
        data: {
          lastRead: new Date(),
        },
      });
    }

    return {
      name: secret?.name ?? "",
      value: secret?.value ?? "",
    };
  }

  return null;
}
