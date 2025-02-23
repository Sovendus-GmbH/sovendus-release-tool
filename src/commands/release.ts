import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { PackageJson, ReleaseConfig } from "../types/index.js";
import { logger, loggerError } from "../utils/logger.js";
import { lintAndBuild, publishPackage } from "../utils/publishing.js";
import {
  bumpVersion,
  checkTagExists,
  hasNewCommitsSinceTag,
  promptVersionIncrement,
} from "../utils/versioning.js";

const DEFAULT_CONFIG_PATH = "sov_release.config.ts";

/**
 * Loads and returns the release configuration.
 */
export async function loadConfig(
  resolvedConfigPath: string,
): Promise<ReleaseConfig> {
  const module = (await import(`file://${resolvedConfigPath}`)) as {
    default: ReleaseConfig;
  };
  return module.default;
}

/**
 * Runs the release process for packages defined in the config.
 */
export async function release(
  configPath: string = DEFAULT_CONFIG_PATH,
): Promise<void> {
  logger(`Using config file: ${configPath}`);
  const resolvedConfigPath = resolve(process.cwd(), configPath);

  if (!existsSync(resolvedConfigPath)) {
    throw new Error(`Config file not found: ${resolvedConfigPath}`);
  }

  const config: ReleaseConfig = await loadConfig(resolvedConfigPath);

  if (!config || !Array.isArray(config.packages)) {
    throw new Error(
      "Invalid config format. Ensure the config exports a default object with a 'packages' array.",
    );
  }

  let overallError = false;
  const affectedPackages: string[] = [];
  const originalCwd = process.cwd();

  for (const pkg of config.packages) {
    // Determine the tag prefix (default to "v" if not provided)
    const tagPrefix = pkg.releaseOptions?.tagPrefix || "v";
    const lastTag = `${tagPrefix}${pkg.version}`;
    logger(`Processing ${pkg.directory}...`);

    if (!(await checkTagExists(lastTag))) {
      logger(`Tag ${lastTag} doesn't exist. Proceeding with release...`);
    } else if (!hasNewCommitsSinceTag(lastTag)) {
      logger(`No new commits since ${lastTag}, skipping version bump.`);
      continue;
    }

    const increment = await promptVersionIncrement();
    const newVersionNumber = bumpVersion(pkg.version, increment);
    const tag = `${tagPrefix}${newVersionNumber}`;

    logger(`Processing ${pkg.directory}...`);

    try {
      if (await checkTagExists(tag)) {
        logger(`Skipping ${pkg.directory}: tag ${tag} already exists.`);
        continue;
      }

      // Change to package directory
      process.chdir(pkg.directory);

      // Update dependency version if flag enabled
      if (pkg.updateDeps) {
        updateDependencyVersion("sovendus-integration-types", newVersionNumber);
      }

      // Only perform full release steps if the release flag is true
      if (pkg.release) {
        lintAndBuild(process.cwd());
        runTests(process.cwd());
        publishPackage(process.cwd(), newVersionNumber, tagPrefix);
        createGitTag(tag);
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

/**
 * Updates a dependency version in the package.json.
 * An optional requireFn can be provided for testing.
 */
export function updateDependencyVersion(
  dependency: string,
  newVersion: string,
): void {
  const pkgPath = `${process.cwd()}/package.json`;
  const packageJson = JSON.parse(readFileSync(pkgPath, "utf8")) as PackageJson;
  if (packageJson.dependencies && packageJson.dependencies[dependency]) {
    packageJson.dependencies[dependency] = newVersion;
    writeFileSync(
      `${process.cwd()}/package.json`,
      JSON.stringify(packageJson, null, 2),
    );
    logger(`Updated dependency ${dependency} to version ${newVersion}`);
  }
}

/**
 * Creates a new Git tag and pushes commits and tags.
 */
export function createGitTag(tag: string): void {
  execSync(`git commit -am "Release: ${tag}"`, { stdio: "inherit" });
  execSync(`git tag ${tag}`, { stdio: "inherit" });
  execSync("git push && git push --tags", { stdio: "inherit" });
}

/**
 * Runs tests for the given package path.
 */
export function runTests(packagePath: string): void {
  const pkgPath = `${packagePath}/package.json`;
  if (!existsSync(pkgPath)) {
    logger(`No package.json found in ${packagePath}, skipping tests.`);
    return;
  }

  const packageJson = JSON.parse(readFileSync(pkgPath, "utf8")) as PackageJson;
  if (!packageJson.scripts || !packageJson.scripts["test"]) {
    logger(
      `No test script found in package.json at ${pkgPath}, skipping tests.`,
    );
    return;
  }

  try {
    execSync(`cd ${packagePath} && yarn test`, { stdio: "inherit" });
  } catch {
    throw new Error(`Tests failed in ${packagePath}`);
  }
}
