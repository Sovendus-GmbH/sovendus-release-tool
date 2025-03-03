import type { PackageJson, ReleasePackage } from "../types/index.js";
import { checkTagExists, createGitTag, hasNewCommitsSinceTag } from "./git.js";
import { logger } from "./logger.js";

export async function publishPackage({
  newTag,
  lastTag,
  packageJson,
  pkg,
}: {
  newTag: string;
  lastTag: string;
  packageJson: PackageJson;
  pkg: ReleasePackage;
}): Promise<void> {
  logger(`Processing tag release (${newTag}) for ${packageJson.name}...`);

  if (!hasNewCommitsSinceTag(lastTag, pkg.directory)) {
    logger(`No new commits since ${lastTag}, skipping lelease.`);
    return;
  }
  if (await checkTagExists(newTag)) {
    logger(`Skipping ${packageJson.name}: tag ${newTag} already exists.`);
    return;
  }

  logger(`Releasing ${packageJson.name}...`);
  createGitTag(newTag, pkg.directory);
}
