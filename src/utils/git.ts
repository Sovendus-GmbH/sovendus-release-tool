import type { ExecException } from "node:child_process";
import { exec, execSync } from "node:child_process";

import inquirer from "inquirer";

import { logger, loggerError } from "./logger.js";

export function getLastVersionFromGitTag(
  tagPrefix: string,
  mainPackagePath: string,
): string {
  try {
    const lastGitTag = execSync(
      `git describe --tags --abbrev=0 --match="${tagPrefix}*"`,
      { cwd: mainPackagePath },
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
export function createGitTag(tag: string, mainPackagePath: string): void {
  try {
    execSync(`git commit -am "Release: ${tag}"`, {
      stdio: "inherit",
      cwd: mainPackagePath,
    });
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
  execSync(`git tag ${tag}`, { stdio: "inherit", cwd: mainPackagePath });
  execSync("git push && git push --tags", {
    stdio: "inherit",
    cwd: mainPackagePath,
  });
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

export function hasNewCommitsSinceTag(
  tag: string,
  mainPackagePath: string,
): boolean {
  const logOutput = execSync(`git log ${tag}..HEAD --oneline || true`, {
    encoding: "utf8",
    cwd: mainPackagePath,
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

export async function ensureMainBranch(): Promise<void> {
  try {
    const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();
    if (currentBranch !== "main") {
      loggerError(`You are currently on branch: ${currentBranch}.`, undefined);
      const { shouldSwitch } = await inquirer.prompt([
        {
          type: "list",
          name: "shouldSwitch",
          message: "Do you want to switch to the main branch?",
          choices: [
            { name: "Switch to main", value: "switch" },
            { name: "Open Pull Request/Merge Request", value: "openRequest" },
            { name: "Cancel", value: "cancel" },
          ],
        },
      ]);

      if (shouldSwitch === "switch") {
        try {
          execSync("git checkout main", {
            stdio: "inherit",
          });
          logger("Switched to the main branch.");
        } catch (error) {
          loggerError("Error switching to main branch:", error);
          process.exit(1);
        }
      } else if (shouldSwitch === "openRequest") {
        logger("Please create a Pull Request or Merge Request.");

        const repoUrl = execSync("git config --get remote.origin.url", {
          encoding: "utf8",
        }).trim();

        let baseUrl = repoUrl.replace(/\.git$/, "");

        if (baseUrl.startsWith("git@")) {
          baseUrl = baseUrl.replace(/^git@([^:]+):/, "https://$1/");
        }

        if (!baseUrl.startsWith("https://") && !baseUrl.startsWith("http://")) {
          baseUrl = `https://${baseUrl}`;
        }

        // Remove trailing slashes
        baseUrl = baseUrl.replace(/\/+$/, "");

        if (repoUrl.includes("github.com")) {
          const githubPrUrl = `${baseUrl}/compare/main...${currentBranch}`;
          logger(`Open a Pull Request on GitHub: ${githubPrUrl}`);
        } else if (repoUrl.includes("gitlab.com")) {
          const gitlabMrUrl = `${baseUrl}/-/merge_requests/new?source_branch=${currentBranch}&target_branch=main`;
          logger(`Open a Merge Request on GitLab: ${gitlabMrUrl}`);
        } else {
          logger("Could not determine the repository type (GitHub/GitLab).");
        }

        process.exit(1);
      } else {
        logger("Release cancelled.");
        process.exit(1);
      }
    }
  } catch (error) {
    loggerError("Error checking current branch:", error);
    process.exit(1);
  }
}

export async function handleUncommittedChanges(): Promise<void> {
  let statusOutput: string;
  try {
    statusOutput = execSync("git status --porcelain", {
      encoding: "utf8",
    });
  } catch (error) {
    loggerError("Error checking git status:", error);
    process.exit(1);
  }

  if (statusOutput.trim().length > 0) {
    logger("Uncommitted changes detected:");
    logger(statusOutput);

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Uncommitted changes found. What do you want to do?",
        choices: [
          { name: "Stage all and commit", value: "commit" },
          { name: "Cancel release", value: "cancel" },
          { name: "Continue anyway", value: "continue" },
        ],
      },
    ]);

    if (action === "cancel") {
      logger("Release cancelled.");
      process.exit(1);
    } else if (action === "continue") {
      logger(
        "Continuing with the release process despite uncommitted changes.",
      );
    } else {
      const { commitMessage } = await inquirer.prompt([
        {
          type: "input",
          name: "commitMessage",
          message: "Enter commit message for the changes:",
        },
      ]);

      try {
        execSync("git add .", { stdio: "inherit" });
        execSync(`git commit -m "${commitMessage}"`, {
          stdio: "inherit",
        });
      } catch (error) {
        loggerError("Error during commit:", error);
        process.exit(1);
      }
    }
  }
}
