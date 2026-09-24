import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import { simpleGit } from "simple-git";

import { PrismaClient } from "#prisma-run";
import {
  DEV_AGENT_MASTER_TOKEN,
  DEV_LIVE_STREAM_JOB_ID,
  DEV_USER_EMAIL,
  DEV_USER_ID,
} from "../src/dev-user.mts";
import { resolveDatabaseUrl } from "../src/tools/database-url.mts";

const adapter = new PrismaPg({ connectionString: resolveDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

const SEED_JOB_IDS = {
  running: "11111111-1111-4111-8111-111111111101",
  success: "11111111-1111-4111-8111-111111111102",
  warning: "11111111-1111-4111-8111-111111111103",
  failed: "11111111-1111-4111-8111-111111111104",
  cancelled: "11111111-1111-4111-8111-111111111105",
  liveStream: DEV_LIVE_STREAM_JOB_ID,
} as const;

const LIVE_STREAM_INITIAL_LOG_COUNT = 250;

function buildLiveStreamLogLines(count: number, startIndex = 0): string[] {
  const phases = [
    "Resolving dependencies",
    "Downloading packages",
    "Building wheel",
    "Running unit tests",
    "Applying migrations",
    "Uploading artifacts",
  ];

  return Array.from({ length: count }, (_, offset) => {
    const index = startIndex + offset;
    const phase = phases[index % phases.length];
    const pct = ((index % 100) + 1).toString().padStart(3, " ");
    return `[${index.toString().padStart(5, "0")}] ${phase} — progress ${pct}%`;
  });
}

const dummySshKey = [
  "-----BEGIN OPENSSH PRIVATE KEY-----",
  "dev-only-not-a-real-key",
  "-----END OPENSSH PRIVATE KEY-----",
  "",
].join("\n");
const dummySshKeyBase64 = Buffer.from(dummySshKey).toString("base64");

const serverDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const devGitStorageDir = path.join(serverDir, "tmp");
const devGitConfigName = "example-crons";
const devBareRepoDir = path.join(devGitStorageDir, "dev-example-crons.git");
const exampleCronSourceDir = path.join(
  serverDir,
  "..",
  "example-git-repository",
);

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function seedDevUser() {
  await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    create: {
      id: DEV_USER_ID,
      email: DEV_USER_EMAIL,
      masterTokenForAgent: DEV_AGENT_MASTER_TOKEN,
    },
    update: {
      email: DEV_USER_EMAIL,
      masterTokenForAgent: DEV_AGENT_MASTER_TOKEN,
    },
  });
}

async function seedAgents() {
  const agents = [
    {
      name: "machine-a",
      token: "dev-agent-machine-a",
      version: "1.1.0",
      seenAt: minutesAgo(1),
    },
    {
      name: "machine-b",
      token: "dev-agent-machine-b",
      version: "1.1.0",
      seenAt: minutesAgo(12),
    },
    {
      name: "staging-worker",
      token: "dev-agent-staging",
      version: "1.0.9",
      seenAt: minutesAgo(180),
    },
  ];

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { name: agent.name },
      create: {
        name: agent.name,
        token: agent.token,
        userId: DEV_USER_ID,
        version: agent.version,
        seenAt: agent.seenAt,
      },
      update: {
        token: agent.token,
        userId: DEV_USER_ID,
        version: agent.version,
        seenAt: agent.seenAt,
      },
    });
  }
}

async function ensureDevBareCronRepository() {
  fs.mkdirSync(devGitStorageDir, { recursive: true });

  if (fs.existsSync(devBareRepoDir)) {
    return `file://${devBareRepoDir}`;
  }

  const workDir = path.join(devGitStorageDir, "seed-example-crons-workdir");
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.cpSync(exampleCronSourceDir, workDir, { recursive: true });

  const workGit = simpleGit(workDir);
  await workGit.init();
  await workGit.add(".");
  await workGit.commit("dev seed: example cron scripts");
  await workGit.branch(["-M", "main"]);

  await simpleGit().init(["--bare", devBareRepoDir]);
  await workGit.push(["--set-upstream", `file://${devBareRepoDir}`, "main"]);

  fs.rmSync(workDir, { recursive: true, force: true });

  return `file://${devBareRepoDir}`;
}

function writeDevSshKeyFile() {
  const keyPath = path.join(devGitStorageDir, `${devGitConfigName}.key`);
  fs.writeFileSync(keyPath, dummySshKey);
  fs.chmodSync(keyPath, 0o600);
}

async function seedGitConfigs() {
  const sshUrl = await ensureDevBareCronRepository();
  writeDevSshKeyFile();

  const clonedDir = path.join(devGitStorageDir, devGitConfigName);
  if (!fs.existsSync(clonedDir)) {
    await simpleGit(devGitStorageDir).clone(sshUrl, devGitConfigName);
  }

  const latestCommit = await simpleGit(clonedDir).log({ maxCount: 1 });
  const commit = latestCommit.latest;

  await prisma.gitConfig.upsert({
    where: { name: devGitConfigName },
    create: {
      name: devGitConfigName,
      userId: DEV_USER_ID,
      enabled: true,
      sshUrl,
      sshPrivateKey: dummySshKeyBase64,
      folderNameInGitRepository: "timelord",
      pullAt: new Date(),
      lastCommitSha: commit?.hash ?? null,
      lastCommitMessage: commit?.message ?? "dev seed: example cron scripts",
    },
    update: {
      userId: DEV_USER_ID,
      enabled: true,
      sshUrl,
      sshPrivateKey: dummySshKeyBase64,
      pullAt: new Date(),
      lastCommitSha: commit?.hash ?? null,
      lastCommitMessage: commit?.message ?? "dev seed: example cron scripts",
    },
  });
}

async function seedSecrets() {
  const secrets = [
    {
      name: "SLACK_WEBHOOK",
      value: "https://hooks.slack.com/services/dev/example",
      comment: "Dummy webhook for local UI",
    },
    {
      name: "AWS_ACCESS_KEY",
      value: "AKIADEVEXAMPLE",
      comment: "Not a real key",
    },
  ];

  for (const secret of secrets) {
    await prisma.secret.upsert({
      where: { name: secret.name },
      create: {
        name: secret.name,
        value: secret.value,
        comment: secret.comment,
        userId: DEV_USER_ID,
        lastRead: minutesAgo(60),
      },
      update: {
        value: secret.value,
        comment: secret.comment,
        userId: DEV_USER_ID,
      },
    });
  }
}

async function seedJobQueue() {
  await prisma.jobQueue.upsert({
    where: {
      jobId: {
        title: "Example timelord machine B",
        userId: DEV_USER_ID,
        hostname: "machine-b",
      },
    },
    create: {
      title: "Example timelord machine B",
      userId: DEV_USER_ID,
      hostname: "machine-b",
      createdAt: minutesAgo(2),
    },
    update: {
      updatedAt: new Date(),
    },
  });
}

async function clearSeedJobs() {
  const ids = Object.values(SEED_JOB_IDS);
  await prisma.log.deleteMany({ where: { jobId: { in: ids } } });
  await prisma.job.deleteMany({ where: { id: { in: ids } } });
}

async function seedJobs() {
  await clearSeedJobs();

  const jobs = [
    {
      id: SEED_JOB_IDS.running,
      title: "Example timelord machine A",
      hostname: "machine-a",
      cron: "0 */1 * * *",
      statusCode: -1,
      createdAt: minutesAgo(3),
      updatedAt: minutesAgo(0),
    },
    {
      id: SEED_JOB_IDS.success,
      title: "Nightly database backup",
      hostname: "machine-a",
      cron: "0 2 * * *",
      statusCode: 0,
      finalState: "Success",
      createdAt: minutesAgo(720),
      updatedAt: minutesAgo(700),
    },
    {
      id: SEED_JOB_IDS.warning,
      title: "Disk usage report",
      hostname: "machine-b",
      cron: "0 8 * * 1",
      statusCode: 0,
      finalState: "Warning",
      statusComment: "Root volume above 80%",
      createdAt: minutesAgo(1440),
      updatedAt: minutesAgo(1430),
    },
    {
      id: SEED_JOB_IDS.failed,
      title: "Sync object storage",
      hostname: "staging-worker",
      cron: "*/15 * * * *",
      statusCode: 1,
      statusComment: "rclone: access denied",
      createdAt: minutesAgo(45),
      updatedAt: minutesAgo(44),
    },
    {
      id: SEED_JOB_IDS.cancelled,
      title: "Long running migration",
      hostname: "machine-a",
      cron: "0 0 * * *",
      statusCode: 130,
      statusComment: "Cancelled by user",
      cancelRequestedAt: minutesAgo(20),
      createdAt: minutesAgo(25),
      updatedAt: minutesAgo(19),
    },
    {
      id: SEED_JOB_IDS.liveStream,
      title: "Live stream test (dev)",
      hostname: "machine-a",
      cron: "manual",
      statusCode: -1,
      createdAt: minutesAgo(15),
      updatedAt: minutesAgo(0),
    },
  ];

  for (const job of jobs) {
    await prisma.job.create({ data: { ...job, userId: DEV_USER_ID } });
  }

  const runningLogLines = [
    "Hey it's a test of timelord!",
    "This script will be performed on machine A",
    "terraform init -backend=false",
    "Initializing provider plugins...",
    "Plan: 2 to add, 0 to change, 0 to destroy.",
  ];

  await prisma.log.createMany({
    data: runningLogLines.map((content, index) => ({
      jobId: SEED_JOB_IDS.running,
      content,
      index,
      type: "stdout",
      userId: DEV_USER_ID,
      createdAt: minutesAgo(3 - index * 0.1),
    })),
  });

  const liveStreamLogLines = buildLiveStreamLogLines(
    LIVE_STREAM_INITIAL_LOG_COUNT,
  );
  await prisma.log.createMany({
    data: liveStreamLogLines.map((content, index) => ({
      jobId: SEED_JOB_IDS.liveStream,
      content,
      index,
      type: index % 17 === 0 ? "stderr" : "stdout",
      userId: DEV_USER_ID,
      createdAt: minutesAgo(15 - index * 0.02),
    })),
  });

  const successLogLines = [
    "Starting backup...",
    "pg_dump: dumping contents of database \"app\"",
    "upload: ./backup.sql to s3://backups/dev/backup.sql",
    "Backup completed successfully.",
  ];

  await prisma.log.createMany({
    data: successLogLines.map((content, index) => ({
      jobId: SEED_JOB_IDS.success,
      content,
      index,
      type: "stdout",
      userId: DEV_USER_ID,
    })),
  });

  const failedLogLines = [
    "rclone sync /data remote:bucket",
    "ERROR : Failed to copy: access denied",
    "Exited with code 1",
  ];

  await prisma.log.createMany({
    data: failedLogLines.map((content, index) => ({
      jobId: SEED_JOB_IDS.failed,
      content,
      index,
      type: index === 1 ? "stderr" : "stdout",
      userId: DEV_USER_ID,
    })),
  });
}

async function main() {
  await seedDevUser();
  await seedAgents();
  await seedGitConfigs();
  await seedSecrets();
  await seedJobQueue();
  await seedJobs();
  console.log("Dev seed data applied (user, agents, git config, secrets, jobs, logs).");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
