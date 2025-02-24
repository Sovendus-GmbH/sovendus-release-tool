import inquirer from "inquirer";

import type { ReleaseConfig } from "../types/index.js";
import {
  checkTagExists,
  createGitTag,
  getLastVersionFromGitTag,
  hasNewCommitsSinceTag,
  promptVersionIncrement,
} from "../utils/git.js";
import { logger, loggerError } from "../utils/logger.js";
import {
  updateDependencyVersion,
  updatePackageVersion,
} from "../utils/package-json.js";
import { runPreStartChecks } from "../utils/pre-start-checks.js";
import { publishPackage } from "../utils/publishing.js";
import { DEFAULT_CONFIG_PATH, loadConfig } from "../utils/release-config.js";
import { lintAndBuild, runTests } from "../utils/scripts.js";
import { bumpVersion, compareVersions } from "../utils/versioning.js";

/**
 * Runs the release process for packages defined in the config.
 */
export async function release(
  configPath: string = DEFAULT_CONFIG_PATH,
): Promise<void> {
  await runPreStartChecks();

  const config: ReleaseConfig = await loadConfig(configPath);

  let overallError = false;
  const affectedPackages: string[] = [];
  const originalCwd = process.cwd();

  for (const pkg of config.packages) {
    const tagPrefix = pkg.releaseOptions?.tagPrefix || "";
    const currentGitVersionNumber = getLastVersionFromGitTag(tagPrefix);
    const currentVersionNumber = (config.globalVersion ||
      pkg.version) as string;

    const lastTag = `${tagPrefix}${currentGitVersionNumber}`;
    logger(`Processing ${pkg.directory}...`);

    if (!hasNewCommitsSinceTag(lastTag)) {
      logger(`No new commits since ${lastTag}, skipping version bump.`);
      continue;
    }

    let finalVersionNumber: string;
    if (!currentVersionNumber) {
      logger(
        `No version specified in config, using last git version if available: ${currentGitVersionNumber}`,
      );
      finalVersionNumber = currentGitVersionNumber;
    } else {
      finalVersionNumber = currentVersionNumber;
    }

    const lastTagVersionIsOlder =
      compareVersions(currentVersionNumber, currentGitVersionNumber) > 0;

    if (!lastTagVersionIsOlder) {
      const increment = await promptVersionIncrement();
      finalVersionNumber = bumpVersion(currentGitVersionNumber, increment);
    } else {
      const { adjust } = await inquirer.prompt([
        {
          type: "confirm",
          name: "adjust",
          message: `Current version (${currentVersionNumber}) is already newer than the last tag (${currentGitVersionNumber}). Change it again?`,
        },
      ]);
      if (adjust) {
        const incrementOverride = await promptVersionIncrement();
        finalVersionNumber = bumpVersion(
          currentGitVersionNumber,
          incrementOverride,
        );
      }
    }

    updatePackageVersion(pkg, finalVersionNumber);

    const newTag = `${tagPrefix}${finalVersionNumber}`;
    logger(`Processing tag (${newTag}) for dir ${pkg.directory}...`);

    try {
      if (await checkTagExists(newTag)) {
        logger(`Skipping ${pkg.directory}: tag ${newTag} already exists.`);
        continue;
      }

      // Change to package directory
      process.chdir(pkg.directory);

      // Update dependency version if flag enabled
      if (pkg.updateDeps) {
        logger(`Updating dependencies for ${pkg.directory}...`);
        updateDependencyVersion(
          "sovendus-integration-types",
          finalVersionNumber,
        );
      }

      // Only perform full release steps if the release flag is true
      if (pkg.release) {
        logger(`Releasing ${pkg.directory}...`);
        lintAndBuild(process.cwd());
        runTests(process.cwd());
        publishPackage(process.cwd(), finalVersionNumber, tagPrefix);
        createGitTag(newTag);
      } else {
        logger(
          `Skipping release steps for ${pkg.directory} as release flag is false.`,
        );
      }

      process.chdir(originalCwd);
    } catch (error) {
      loggerError(`Error processing ${pkg.directory}:`, error);
      affectedPackages.push(pkg.directory);
      try {
        process.chdir(originalCwd);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // ignore
      }
      overallError = true;
    }
  }

  if (overallError) {
    loggerError(
      "The release process encountered errors for the following packages:",
      affectedPackages.join(", "),
    );
    throw new Error("Release process encountered errors.");
  }
}
