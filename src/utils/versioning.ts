import type { ExecException } from "child_process";
import { exec } from "child_process";

export function bumpVersion(
  currentVersion: string,
  increment: "patch" | "minor" | "major",
): string {
  const versionParts = currentVersion.split(".").map(Number);

  switch (increment) {
    case "major":
      versionParts[0]++;
      versionParts[1] = 0;
      versionParts[2] = 0;
      break;
    case "minor":
      versionParts[1]++;
      versionParts[2] = 0;
      break;
    case "patch":
      versionParts[2]++;
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
