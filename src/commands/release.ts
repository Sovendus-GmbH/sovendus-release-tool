import type { ReleaseConfig } from "../types/index.js";
import { logger, loggerError } from "../utils/logger.js";
import {
  getPackageJson,
  updateDependencies,
  updatePackageVersion,
} from "../utils/package-json.js";
import { runPreStartChecks } from "../utils/pre-start-checks.js";
import { publishPackage } from "../utils/publishing.js";
import { DEFAULT_CONFIG_PATH, loadConfig } from "../utils/release-config.js";
import { lintAndBuild, runTests } from "../utils/scripts.js";
import { getVersion, updateVariableStringValue } from "../utils/versioning.js";

/**
 * Runs the release process for packages defined in the config.
 */
export async function release(
  configPath: string = DEFAULT_CONFIG_PATH,
): Promise<void> {
  await runPreStartChecks();

  const config: ReleaseConfig = await loadConfig(configPath);

  const packageManager = config.packageManager || "yarn";
  logger(`Using package manager: ${packageManager}`);

  let overallError = false;
  const affectedPackages: string[] = [];
  const originalCwd = process.cwd();

  for (const pkg of config.packages) {
    const packageJson = getPackageJson(pkg);
    try {
      if (pkg.updateDeps) {
        logger(`Updating dependencies for ${packageJson.name}...`);
        updateDependencies(pkg, packageManager);
      }
      if (pkg.lintAndBuild) {
        logger(`Linting ${packageJson.name}`);
        lintAndBuild(process.cwd());
      }
      if (pkg.test) {
        logger(`Running tests for ${packageJson.name}`);
        runTests(process.cwd());
      }

      const { newVersion, lastTag, newTag } = await getVersion(
        pkg,
        packageJson,
        config,
      );

      updatePackageVersion(pkg, newVersion);
      updateVariableStringValue(pkg, newVersion);

      if (pkg.release) {
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
