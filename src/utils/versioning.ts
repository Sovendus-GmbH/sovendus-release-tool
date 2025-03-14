import { readFileSync, writeFileSync } from "node:fs";

import inquirer from "inquirer";

import type {
  PackageJson,
  ReleaseConfig,
  ReleaseOptions,
  ReleasePackage,
} from "../types/index.js";
import { getLastVersionFromGitTag, promptVersionIncrement } from "./git.js";
import { logger } from "./logger.js";

interface VersionInfo {
  newVersion: string;
  lastTag: string;
  newTag: string;
}

export async function getVersion(
  pkg: ReleasePackage,
  packageJson: PackageJson,
  config: ReleaseConfig,
  releaseConfig: ReleaseOptions,
): Promise<VersionInfo> {
  const tagPrefix = releaseConfig.tagPrefix || "";
  const currentGitVersionNumber = getLastVersionFromGitTag(
    tagPrefix,
    pkg.directory,
  );
  const currentVersionNumber = config.globalVersion || releaseConfig.version;

  const lastTag = `${tagPrefix}${currentGitVersionNumber}`;
  logger(`Processing ${packageJson.name}...`);

  let finalVersionNumber: string;
  if (!currentVersionNumber) {
    logger(
      `No version specified in config, using last git version if available: ${currentGitVersionNumber}`,
    );
    finalVersionNumber = currentGitVersionNumber;
  } else {
    finalVersionNumber = currentVersionNumber;
  }

  const lastTagVersionIsOlder =
    compareVersions(currentVersionNumber, currentGitVersionNumber) > 0;

  if (!lastTagVersionIsOlder) {
    const increment = await promptVersionIncrement();
    finalVersionNumber = bumpVersion(currentGitVersionNumber, increment);
  } else {
    const { adjust } = await inquirer.prompt([
      {
        type: "confirm",
        name: "adjust",
        default: false,
        message: `Current version (${currentVersionNumber}) is already newer than the last tag (${currentGitVersionNumber}). Change it again?`,
      },
    ]);
    if (adjust) {
      const incrementOverride = await promptVersionIncrement();
      finalVersionNumber = bumpVersion(
        currentGitVersionNumber,
        incrementOverride,
      );
    }
  }
  const newTag = `${tagPrefix}${finalVersionNumber}`;

  return { newVersion: finalVersionNumber, lastTag, newTag };
}

export function compareVersions(a: string, b: string): number {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);

  // Destructure with default values of 0 for any missing parts
  const [ma = 0, mi = 0, pa = 0] = aParts;
  const [mb = 0, mm = 0, pb = 0] = bParts;

  if (ma !== mb) {
    return ma - mb;
  }
  if (mi !== mm) {
    return mi - mm;
  }
  return pa - pb;
}

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

export function updateVariableStringValue(
  newVersion: string,
  releaseConfig: ReleaseOptions,
): void {
  releaseConfig.versionBumper?.forEach((fileInfo) => {
    const fileContent = readFileSync(fileInfo.filePath, "utf8");
    let updatedContent = fileContent;

    // Check file extension to determine which regex pattern to use
    const isPhpFile = fileInfo.filePath.toLowerCase().endsWith(".php");

    if (isPhpFile) {
      // Match PHP define('CONSTANT_NAME', 'value') pattern
      const phpDefineRegex = new RegExp(
        `(define\\s*\\(\\s*["']${fileInfo.varName}["']\\s*,\\s*["'])([^"']*)(["'])`,
        "g",
      );
      updatedContent = fileContent.replace(phpDefineRegex, `$1${newVersion}$3`);
    } else {
      // Only match const variableName = "value" pattern for JS/TS
      const constRegex = new RegExp(
        `(const\\s+${fileInfo.varName}\\s*=\\s*["'])([^"']*)(["'])`,
        "g",
      );
      updatedContent = fileContent.replace(constRegex, `$1${newVersion}$3`);
    }

    // If no changes were made, the variable wasn't found or isn't in the expected format
    if (updatedContent === fileContent) {
      const formatDescription = isPhpFile
        ? "define('CONSTANT_NAME', 'value')"
        : "const variableName = 'value'";

      throw new Error(
        `Could not find a matching declaration for '${fileInfo.varName}' in '${fileInfo.filePath}' or the format is not supported. Only ${formatDescription} format is supported.`,
      );
    }

    // Write the updated content back to the file
    writeFileSync(fileInfo.filePath, updatedContent);
    logger(`Updated version in ${fileInfo.filePath} to ${newVersion}`);
  });
}
