import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import inquirer from "inquirer";

import type { PackageJson, ReleasePackage } from "../types/index.js";
import { logger, loggerError } from "./logger.js";

/**
 * Reads the package.json file for a package and returns its contents.
 */
export function getPackageJson(cwd: string): PackageJson {
  const packageJsonPath = join(cwd, "package.json");
  if (!existsSync(packageJsonPath)) {
    throw new Error(`No package.json found in ${packageJsonPath}`);
  }
  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
}

/**
 * Updates a dependency version in the package.json.
 * An optional requireFn can be provided for testing.
 */
export async function updateDependencies(
  pkg: ReleasePackage,
  _packageManager: string,
  cwd: string,
): Promise<void> {
  if (pkg.updateDeps !== "force") {
    const { shouldUpdate } = await inquirer.prompt([
      {
        type: "confirm",
        name: "shouldUpdate",
        message: `Update dependencies for ${pkg.directory}?`,
        default: false,
      },
    ]);

    if (!shouldUpdate) {
      logger(`Skipping dependency updates for ${pkg.directory}`);
      return;
    }
  }

  const packageJson = getPackageJson(cwd);
  try {
    const ignoreList = packageJson.updateIgnoreDependencies || [];

    // Build ignore list arguments
    const ignoreArg =
      ignoreList.length > 0 ? `--reject ${ignoreList.join(",")}` : "";

    logger(`Updating dependencies for ${pkg.directory}`);
    // Run npm-check-updates to find and update package.json
    execSync(`ncu -u ${ignoreArg}`, {
      cwd,
      stdio: "inherit",
    });
    logger(`Successfully updated dependencies for ${pkg.directory}`);
    logger(
      `Please run "cd ${pkg.directory} && yarn install" manually then rerun this script`,
    );
    process.exit(0);

    // TODO causes the node_modules to be destroyed
    // // Install dependencies with the correct path setup
    // execSync(`${packageManager} install --ignore-scripts`, {
    //   cwd: pkgPath,
    //   stdio: "inherit",
    //   env: {
    //     ...process.env,
    //   },
    // });
  } catch (error) {
    loggerError(
      `Error updating dependencies for ${pkg.directory}. Continuing with release process.`,
      error,
    );
    throw error;
  }
}

/**
 * Updates the version in the package.json file and also in sov_release.config.ts.
 */
export function updatePackageVersion(
  pkg: ReleasePackage,
  newVersion: string,
  cwd: string,
  originalCwd: string,
): void {
  // Update package's package.json
  const packageJson = getPackageJson(cwd);

  packageJson.version = newVersion;
  const packageJsonPath = join(cwd, "package.json");
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  logger(`Updated version for ${pkg.directory} to ${newVersion}`);

  // Update version in sov_release.config.ts (both globalVersion if available and package's own version)
  const configPath = join(originalCwd, "sov_release.config.ts");
  if (existsSync(configPath)) {
    let configContent = readFileSync(configPath, "utf8");

    // Update globalVersion if it exists
    configContent = configContent.replace(
      /globalVersion\s*:\s*["']([^"']*)["']/,
      `globalVersion: "${newVersion}"`,
    );

    // Helper to escape regex special characters in a directory string
    const escapeRegex = (s: string): string =>
      s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const dirPattern = escapeRegex(pkg.directory);

    // Find the package object by matching its directory and update its version property.
    const packageRegex = new RegExp(
      `(\\{[^}]*?directory\\s*:\\s*["']${dirPattern}["'][^}]*?version\\s*:\\s*["'])([^"']+)(["'])`,
      "m",
    );
    configContent = configContent.replace(
      packageRegex,
      (_match, p1, _p2, p3) => {
        return `${p1}${newVersion}${p3}`;
      },
    );

    writeFileSync(configPath, configContent);
    logger(
      `Updated sov_release.config.ts for package ${pkg.directory} to ${newVersion}`,
    );
  } else {
    logger("sov_release.config.ts not found. Skipping config update.");
  }
}
