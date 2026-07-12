import fastifyRequestContext from "@fastify/request-context";

import { FastifyInstance, FastifyRequest } from "fastify";
import fs from "fs";

import { logger } from "./logger.mts";
import { StoreUnavailableError } from "./store.mts";
import { extractAgentMetadata } from "./middlewares/extract-agent-metadata.mts";
import { extractHumanMetadata } from "./middlewares/extract-human-metadata.mts";
import { prisma } from "./prisma-client.mts";
import { env } from "./tools/env.mts";
import { prometheus } from "./tools/metrics.mts";
import { setupSSH } from "./tools/setup-ssh.mts";
import { createAgent } from "./use-cases/agents/create-agent.mts";
import { deleteAgent } from "./use-cases/agents/delete-agent.mts";
import { agentHeartbeat } from "./use-cases/agents/heartbeat.mts";
import { listAgents } from "./use-cases/agents/list-agents.mts";
import { addGitConfig } from "./use-cases/git-config/add-git-config.mts";
import { listGitConfigs } from "./use-cases/git-config/list-git-config.mts";
import { refreshGitConfig } from "./use-cases/git-config/refresh-git-config.mts";
import { getHomepageStatus } from "./use-cases/homepage/get-homepage-status.mts";
import { addJobToQueue } from "./use-cases/jobs/add-job-to-queue.mts";
import { clearJobQueue } from "./use-cases/jobs/clear-job-queue.mts";
import { getJob } from "./use-cases/jobs/get-job/index.mts";
import { getJobAssets } from "./use-cases/jobs/get-job-assets.mts";
import { listJobs } from "./use-cases/jobs/list-jobs.mts";
import { listActivity } from "./use-cases/activity/list-activity.mts";
import { listLogs } from "./use-cases/logs/list-logs.mts";
import { pushLogs } from "./use-cases/logs/push-logs.mts";
import { logout } from "./use-cases/oidc/logout.mts";
import { oidcAuthorization } from "./use-cases/oidc/oidc-authorization.mts";
import { oidcHandleCallback } from "./use-cases/oidc/oidc-handle-callback.mts";
import { createSecret } from "./use-cases/secrets/create-secret.mts";
import { deleteSecret } from "./use-cases/secrets/delete-secret.mts";
import { listSecrets } from "./use-cases/secrets/list-secrets.mts";

// Setup
fs.mkdirSync(env.GIT_CONFIGS_REPOSITORY, { recursive: true });
void setupSSH().then(async () => {
  await refreshGitConfig();
});

const MINUTES = 1000 * 60;
setInterval(() => {
  void setupSSH().then(async () => {
    await refreshGitConfig();
  });
}, 5 * MINUTES);

export function router(fastify: FastifyInstance) {
  fastify.register(fastifyRequestContext);
  fastify.register(import("@fastify/cors"), {
    origin: env.UI_URL,
    credentials: true,
  });
  fastify.register(import("@fastify/cookie"));
  fastify.register(import("@fastify/formbody"));

  ///////////////////////////////////////////////////////////////////////////
  // 🌟 Technical
  ///////////////////////////////////////////////////////////////////////////

  fastify.get("/health", () => "OK");
  fastify.get("/homepage", async (request, reply) => {
    if (env.HOMEPAGE_TOKEN.defined) {
      const authorization = request.headers.authorization;
      const token = authorization?.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length)
        : request.headers["x-homepage-token"];

      if (token !== env.HOMEPAGE_TOKEN.value) {
        reply.status(401).send("Not authorized");
        return;
      }
    }

    return await getHomepageStatus();
  });
  fastify.get("/metrics", async (_, reply) => {
    reply.header("Content-Type", prometheus.contentType);
    return await prometheus.metrics();
  });
  fastify.get("/version", () => {
    const date = new Date(env.CI_PIPELINE_CREATED * 1000);
    const vaultEnabled = Boolean(env.VAULT_ADDR && env.VAULT_TOKEN);

    return {
      authenticationDisabled: env.DISABLE_AUTHENTICATION,
      buildCommitSha: env.CI_COMMIT_SHA,
      buildDate: date.toISOString(),
      oidcProviderName: env.OIDC_PROVIDER_NAME,
      oidcProviderImage: env.OIDC_PROVIDER_IMAGE,
      vaultEnabled,
      vaultAddr: vaultEnabled ? env.VAULT_ADDR : undefined,
    };
  });

  ///////////////////////////////////////////////////////////////////////////
  // 🤖 Agents
  ///////////////////////////////////////////////////////////////////////////

  fastify.register(function (fastify) {
    fastify.addHook("onRequest", extractAgentMetadata);

    fastify.get("/job", getJob);
    fastify.get("/job/assets", getJobAssets);

    fastify.post(
      "/job",
      async (
        request: FastifyRequest<{
          Body: {
            id: string;
            statusCode: number;
            finalState?: string;
          };
        }>,
      ) => {
        const body = request.body;

        if (body.id) {
          const data: { statusCode: number; finalState?: string } = {
            statusCode: body.statusCode,
          };

          if (
            body.finalState &&
            ["Success", "Warning", "Error"].includes(body.finalState)
          ) {
            data.finalState = body.finalState;
          }

          await prisma.job.update({
            where: {
              id: body.id,
            },
            data,
          });
        }

        return "OK";
      },
    );
    fastify.post("/logs", pushLogs);
    fastify.post("/heartbeat", agentHeartbeat);
  });

  ///////////////////////////////////////////////////////////////////////////
  // 🎩 Humans
  ///////////////////////////////////////////////////////////////////////////

  fastify.get("/connect", oidcAuthorization);
  fastify.get("/callback", oidcHandleCallback);
  fastify.get("/logout", logout);

  fastify.register(function (fastify) {
    fastify.addHook("onRequest", extractHumanMetadata);

    fastify.delete("/agents/:name", deleteAgent);
    fastify.delete("/secrets", deleteSecret);
    fastify.get("/agents", listAgents);
    fastify.get("/git-configs", listGitConfigs);
    fastify.get("/jobs", listJobs);
    fastify.get("/activity", listActivity);
    fastify.get("/logs", listLogs);
    fastify.get("/secrets", listSecrets);
    fastify.post("/agents", createAgent);
    fastify.post("/git-configs", addGitConfig);
    fastify.post("/git-configs/refresh", refreshGitConfig);
    fastify.post("/jobs/queue", addJobToQueue);
    fastify.delete("/jobs/queue", clearJobQueue);
    fastify.post("/secrets", createSecret);
  });

  fastify.setErrorHandler(async (error, _, reply) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message);

    if (error instanceof StoreUnavailableError) {
      reply.status(403).send({ msg: "Not authorized" });
      return;
    }

    reply.status(500).send({ msg: "Error" });
  });

  logger.info("Router mounted");
}
