import type { GitConfig } from "#prisma";

import fs from "fs";
import path from "path";

import { env } from "../../../tools/env.mts";

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
    if (fs.existsSync(folder)) {
      files = [
        ...files,
        ...fs.readdirSync(folder).map(file => `${folder}/${file}`),
      ];
    }
  }

  return files;
}
