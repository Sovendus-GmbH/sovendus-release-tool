import type { ExecException } from "node:child_process";
import { exec, execSync } from "node:child_process";

import inquirer from "inquirer";

export function bumpVersion(
  currentVersion: string,
  increment: "patch" | "minor" | "major",
): string {
  const versionParts = currentVersion.split(".").map(Number);

  if (versionParts.length !== 3) {
    throw new Error("Invalid version format");
  }

  switch (increment) {
    case "major":
      versionParts[0] = (versionParts[0] ?? 0) + 1;
      versionParts[1] = 0;
      versionParts[2] = 0;
      break;
    case "minor":
      versionParts[1] = (versionParts[1] ?? 0) + 1;
      versionParts[2] = 0;
      break;
    case "patch":
      versionParts[2] = (versionParts[2] ?? 0) + 1;
      break;
  }

  return versionParts.join(".");
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
