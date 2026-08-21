import type { GitConfig } from "#prisma";
import { env } from "#src/tools/env.mts";

import fs from "fs";
import path from "path";

import { resolveIdentityFolder } from "./queue-target.mts";

export function getSriptsByIdentity(
  configs: Array<GitConfig>,
  identity: string,
): Array<string> {
  const folders = configs
    // Only use repositories enabled
    .filter(c => c.enabled)
    .map(c =>
      path.join(
        env.GIT_CONFIGS_REPOSITORY,
        c.name,
        c.folderNameInGitRepository,
        identity,
      ),
    );

  let files: Array<string> = [];
  for (const folder of folders) {
    const resolvedFolder = resolveIdentityFolder(folder);
    if (resolvedFolder) {
      files = [
        ...files,
        ...fs.readdirSync(resolvedFolder).map(file => `${resolvedFolder}/${file}`),
      ];
    }
  }

  return files;
}
