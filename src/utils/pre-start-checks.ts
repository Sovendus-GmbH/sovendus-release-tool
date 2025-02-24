import { execSync } from "node:child_process";

import inquirer from "inquirer";

import { logger, loggerError } from "./logger.js";

export async function runPreStartChecks(): Promise<void> {
  let statusOutput: string;
  try {
    statusOutput = execSync("git status --porcelain", { encoding: "utf8" });
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
        ],
      },
    ]);

    if (action === "cancel") {
      logger("Release cancelled.");
      process.exit(1);
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
        execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });
      } catch (error) {
        loggerError("Error during commit:", error);
        process.exit(1);
      }
    }
  }

  // Switch to main branch
  try {
    execSync("git checkout main", { stdio: "inherit" });
  } catch (error) {
    loggerError("Error switching to main branch:", error);
    process.exit(1);
  }
}
