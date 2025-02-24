import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import type { PackageJson } from "../types/index.js";
import { logger } from "./logger.js";

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

export const lintAndBuild = (packagePath: string): void => {
  let lintOutput = "";
  try {
    // Capture lint output; let eslint fail on lint errors
    lintOutput = err.stdout ? err.stdout.toString() : err.message;
    console.error(`\n${lintOutput}`);
    console.error(
      `Linting errors detected in ${packagePath}. Aborting release.`,
    );
    process.exit(1);
  } catch (err: any) {
    lintOutput = err.stdout ? err.stdout.toString() : err.message;
    console.error(`\n${lintOutput}`);
    throw new Error(
      `Linting errors detected in ${packagePath}. Aborting release.`,
    );
  }

  // Run the build command (output directly to the terminal)
  execSync(`cd ${packagePath} && yarn build`, { stdio: "inherit" });

  // If there is any lint output (e.g. warnings), print it at the bottom
  if (lintOutput.trim().length > 0) {
    console.log(`\n${lintOutput}`);
  }
};
