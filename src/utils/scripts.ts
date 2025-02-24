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
    // Capture lint output and let eslint fail on lint errors
    lintOutput = execSync(`cd ${packagePath} && yarn lint`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err: any) {
    // Capture the lint output from stderr or error message
    lintOutput = err.stdout ? err.stdout.toString() : err.message;
    // Ensure linting errors appear at the bottom
    console.log("\nLinting output:");
    console.log(lintOutput);
    throw new Error(
      `Linting errors detected in ${packagePath}. Aborting release.`,
    );
  }

  // Run the build command (its output goes directly to the terminal)
  execSync(`cd ${packagePath} && yarn build`, { stdio: "inherit" });

  // Display linting output if any (warnings may still appear here)
  if (lintOutput.trim().length > 0) {
    console.log("\nLinting output:");
    console.log(lintOutput);
  }
};
