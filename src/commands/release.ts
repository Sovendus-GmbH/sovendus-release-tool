import { execSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";

import type { PackageJson, ReleaseConfig } from "../types";
import { lintAndBuild, publishPackage } from "../utils/publishing";
import { checkTagExists } from "../utils/versioning";

const requireFn: <TReturnType>(path: string) => TReturnType = require;

const DEFAULT_CONFIG_PATH = "sov_release.config.ts";

/**
 * Loads and returns the release configuration.
 */
export async function loadConfig(
  resolvedConfigPath: string,
): Promise<ReleaseConfig> {
  const module = await import(`file://${resolvedConfigPath}`);
  return module.default as ReleaseConfig;
}

/**
 * Runs the release process for packages defined in the config.
 */
export async function release(
  newVersionNumber: string,
  configPath: string = DEFAULT_CONFIG_PATH,
): Promise<void> {
  console.log(`Using config file: ${configPath}`);
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
    const tag = `${tagPrefix}${newVersionNumber}`;

    console.log(`Processing ${pkg.directory}...`);

    try {
      if (await checkTagExists(tag)) {
        console.log(`Skipping ${pkg.directory}: tag ${tag} already exists.`);
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
        console.log(
          `Skipping release steps for ${pkg.directory} as release flag is false.`,
        );
      }

      process.chdir(originalCwd);
    } catch (error) {
      console.error(`Error processing ${pkg.directory}:`, error);
      affectedPackages.push(pkg.directory);
      try {
        process.chdir(originalCwd);
      } catch (e) {
        // ignore
      }
      overallError = true;
    }
  }

  if (overallError) {
    console.error(
      "The release process encountered errors for the following packages:",
    );
    console.error(affectedPackages.join(", "));
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
  const packageJson = requireFn<PackageJson>(`${process.cwd()}/package.json`);
  if (packageJson.dependencies && packageJson.dependencies[dependency]) {
    packageJson.dependencies[dependency] = newVersion;
    writeFileSync(
      `${process.cwd()}/package.json`,
      JSON.stringify(packageJson, null, 2),
    );
    console.log(`Updated dependency ${dependency} to version ${newVersion}`);
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
  try {
    execSync(`cd ${packagePath} && yarn test`, { stdio: "inherit" });
  } catch (error) {
    throw new Error(`Tests failed in ${packagePath}`);
  }
}
