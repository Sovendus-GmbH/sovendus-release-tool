import type { ExecException } from "node:child_process";
import { exec, execSync } from "node:child_process";

import inquirer from "inquirer";

import { logger, loggerError } from "./logger.js";

export function getLastVersionFromGitTag(tagPrefix: string): string {
  try {
    const lastGitTag = execSync(
      `git describe --tags --abbrev=0 --match="${tagPrefix}*"`,
    )
      .toString()
      .trim();
    const currentTagVersionNumber = lastGitTag.replace(tagPrefix, "");
    return currentTagVersionNumber;
  } catch (error) {
    loggerError(
      "No previous tag found. Using 0.0.0 as the initial version.",
      error,
    );
    return "0.0.0";
  }
}

/**
 * Creates a new Git tag and pushes commits and tags.
 */
export function createGitTag(tag: string): void {
  try {
    execSync(`git commit -am "Release: ${tag}"`, { stdio: "inherit" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("nothing to commit")) {
        logger("No changes detected, skipping git commit.");
      } else {
        loggerError("Failed to commit changes.", error);
        throw error;
      }
    } else {
      throw error;
    }
  }
  execSync(`git tag ${tag}`, { stdio: "inherit" });
  execSync("git push && git push --tags", { stdio: "inherit" });
}

export function checkTagExists(tag: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec(
      `git tag --list ${tag}`,
      (error: ExecException | null, stdout: string) => {
        if (error) {
          return reject(error);
        }
        resolve(stdout.trim().length > 0);
      },
    );
  });
}

export function hasNewCommitsSinceTag(tag: string): boolean {
  const logOutput = execSync(`git log ${tag}..HEAD --oneline || true`, {
    encoding: "utf8",
  });
  return logOutput.trim().length > 0;
}

export async function promptVersionIncrement(): Promise<
  "major" | "minor" | "patch"
> {
  const answers: { increment: "major" | "minor" | "patch" } =
    await inquirer.prompt([
      {
        type: "list",
        name: "increment",
        message: "Choose the next version increment:",
        choices: ["major", "minor", "patch"],
      },
    ]);
  return answers.increment;
}
