import { join } from "node:path";

import type { ReleaseConfig } from "../types/index.js";
import { handleUncommittedChanges } from "../utils/git.js";
import { logger, loggerError } from "../utils/logger.js";
import {
  getPackageJson,
  updateDependencies,
  updatePackageVersion,
} from "../utils/package-json.js";
import { publishPackage } from "../utils/publishing.js";
import { DEFAULT_CONFIG_PATH, loadConfig } from "../utils/release-config.js";
import { build, lint, runTests } from "../utils/scripts.js";
import { getVersion, updateVariableStringValue } from "../utils/versioning.js";

/**
 * Runs the release process for packages defined in the config.
 */
export async function release(
  configPath: string = DEFAULT_CONFIG_PATH,
): Promise<void> {
  const config: ReleaseConfig = await loadConfig(configPath);

  const packageManager = config.packageManager || "yarn";
  logger(`Using package manager: ${packageManager}`);

  let overallError = false;
  const affectedPackages: string[] = [];
  const originalCwd = process.cwd();

  for (const pkg of config.packages) {
    const cwd = join(originalCwd, pkg.directory);
    const packageJson = getPackageJson(cwd);
    try {
      if (pkg.updateDeps) {
        logger(`Updating dependencies for ${packageJson.name}...`);
        await updateDependencies(pkg, packageManager, cwd);
      }
      if (pkg.lint) {
        logger(`Linting ${packageJson.name}`);
        lint(cwd);
      }
      if (pkg.build) {
        logger(`Building ${packageJson.name}`);
        build(cwd);
      }
      if (pkg.test) {
        logger(`Running tests for ${packageJson.name}`);
        runTests(cwd);
      }
      const releaseConfig = pkg.release;
      if (releaseConfig) {
        await handleUncommittedChanges();

        const { newVersion, lastTag, newTag } = await getVersion(
          pkg,
          packageJson,
          config,
          releaseConfig,
        );

        updatePackageVersion(pkg, newVersion, cwd, originalCwd);
        updateVariableStringValue(newVersion, releaseConfig);

        if (pkg.build) {
          logger(`Building again with new version for ${packageJson.name}`);
          build(cwd);
        }

        await publishPackage({ newTag, lastTag, packageJson, pkg });
      }
    } catch (error) {
      loggerError(`Error processing ${packageJson.name}:`, error);
      affectedPackages.push(pkg.directory);
      overallError = true;
    }
    try {
      process.chdir(originalCwd);
    } catch {
      // ignore
    }
  }

  if (overallError) {
    loggerError(
      "The release process encountered the above errors for the following packages:",
      affectedPackages.join(", "),
    );
    process.exit(1);
  }
}
