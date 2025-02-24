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
    // Capture lint output instead of using "inherit"
    lintOutput = execSync(`cd ${packagePath} && yarn lint`, {
      encoding: "utf8",
      stdio: ["inherit", "pipe", "pipe"],
    });
  } catch (err: any) {
    // Capture any error output from linting
    lintOutput = err.stdout ? err.stdout.toString() : err.message;
  }

  // Run the build command (its output goes directly to the terminal)
  execSync(`cd ${packagePath} && yarn build`, { stdio: "inherit" });

  // Now, display linting output at the bottom, if any
  if (lintOutput.trim().length > 0) {
    console.log("\nLinting output:");
    console.log(lintOutput);
  }
};
