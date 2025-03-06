import inquirer from "inquirer";

import type { PackageJson, ReleasePackage } from "../types/index.js";
import {
  checkTagExists,
  createGitTag,
  ensureMainBranch,
  hasNewCommitsSinceTag,
} from "./git.js";
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
  await ensureMainBranch();

  if (!hasNewCommitsSinceTag(lastTag, pkg.directory)) {
    logger(`No new commits since ${lastTag}, skipping release.`);
    return;
  }
  if (await checkTagExists(newTag)) {
    logger(`Skipping ${packageJson.name}: tag ${newTag} already exists.`);
    return;
  }

  // Ask user if they want to publish with default "Yes"
  const { shouldPublish } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldPublish",
      message: `Publish ${packageJson.name} with tag ${newTag}?`,
      default: true, // Default to Yes
    },
  ]);

  if (!shouldPublish) {
    logger(`Skipping release of ${packageJson.name}`);
    return;
  }

  logger(`Releasing ${packageJson.name}...`);
  createGitTag(newTag, pkg.directory);
}
