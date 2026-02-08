import vault from "node-vault";

import { logger } from "../../../logger.mts";
import { prisma } from "../../../prisma-client.mts";
import { getRobotStore } from "../../../store.mts";
import { env } from "../../../tools/env.mts";

const options = {
  apiVersion: "v1",
  endpoint: env.VAULT_ADDR,
  token: env.VAULT_TOKEN,
};

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
  let secret: string | null = "";

  if (env.VAULT_ADDR && env.VAULT_TOKEN) {
    logger.info("Getting secret from Vault is accepted");

    try {
      const vaultClient = vault(options);
      secret = await vaultClient
        .read(env.VAULT_PATH)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .then(secret => secret.data.data?.[secretKey]);
    } catch (err) {
      logger.error(err);
    }
  }

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

  if (env.VAULT_ADDR && env.VAULT_TOKEN) {
    logger.info("findSecretInLine Vault accepted");

    try {
      const vaultClient = vault(options);
      const secrets = await vaultClient
        .read(env.VAULT_PATH)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .then(data => data.data.data);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const secretName = Object.keys(secrets).filter(name =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        value.includes(secrets[name]),
      )[0];

      if (secretName) {
        return {
          name: secretName,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          value: secrets[secretName],
        };
      }
    } catch (err) {
      logger.error(err);
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
