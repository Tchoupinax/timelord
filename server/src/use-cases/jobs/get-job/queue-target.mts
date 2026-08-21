import fs from "fs";
import path from "path";

export function resolveIdentityFolder(folderPath: string): string | null {
  if (fs.existsSync(folderPath)) {
    return folderPath;
  }

  const parent = path.dirname(folderPath);
  const identityName = path.basename(folderPath);

  if (!fs.existsSync(parent)) {
    return null;
  }

  const match = fs
    .readdirSync(parent, { withFileTypes: true })
    .find(entry => entry.isDirectory() && entry.name.toLowerCase() === identityName.toLowerCase());

  return match ? path.join(parent, match.name) : null;
}

export function agentMatchesQueueTarget(
  agentIdentity: string,
  queueHostname: string,
): boolean {
  if (!queueHostname) {
    return true;
  }

  return queueHostname.toLowerCase() === agentIdentity.toLowerCase();
}

export function queueTargetMatchesJobHostname(
  queueHostname: string,
  jobHostname: string | null | undefined,
): boolean {
  if (!queueHostname) {
    return true;
  }

  if (!jobHostname) {
    return false;
  }

  return queueHostname.toLowerCase() === jobHostname.toLowerCase();
}
