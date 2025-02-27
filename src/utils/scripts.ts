import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import type { PackageJson } from "../types/index.js";
import { logger } from "./logger.js";
import { join } from "node:path";

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
    execSync(`yarn test`, { stdio: "inherit", cwd: packagePath });
  } catch {
    throw new Error(`Tests failed in ${packagePath}`);
  }
}

export const lintAndBuild = (packagePath: string): void => {
  let lintOutput = "";
  try {
    // Use the local eslint binary directly from node_modules
    const eslintPath = join(packagePath, "node_modules", ".bin", "eslint");
    
    // Check if eslint exists and use it directly
    if (existsSync(eslintPath)) {
      lintOutput = execSync(`${eslintPath} --fix`, {
        encoding: "utf8",
        env: { ...process.env, FORCE_COLOR: "1" },
        cwd: packagePath
      });
    } else {
      // Fall back to yarn lint if eslint binary not found
      lintOutput = execSync(`yarn lint`, {
        encoding: "utf8",
        env: { ...process.env, FORCE_COLOR: "1" },
        cwd: packagePath
      });
    }
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "stdout" in error &&
      error.stdout
    ) {
      lintOutput =
        (error as { stdout?: string | Buffer }).stdout?.toString() ?? "";
    } else if (error instanceof Error) {
      lintOutput = error.message;
    } else {
      lintOutput = "Unknown linting error.";
    }
    // eslint-disable-next-line no-console
    console.error(`\n${lintOutput}`);
    // eslint-disable-next-line no-console
    console.error(
      `%c[Sovendus-Release-Tool][ERROR] Linting errors detected in ${packagePath}. Aborting release.`,
      "color: red; font-size: larger;",
    );

    process.exit(1);
  }

  // Run the build command (output directly to the terminal)
  execSync(`yarn build`, { stdio: "inherit", cwd: packagePath });

  // If there is any lint output (e.g. warnings), print it at the bottom
  if (lintOutput.trim().length > 0) {
    logger(`\n${lintOutput}`);
  }
};