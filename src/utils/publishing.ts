import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import archiver from "archiver";
import inquirer from "inquirer";

import type { PackageJson, ReleasePackage } from "../types/index.js";
import {
  checkTagExists,
  createGitTag,
  ensureMainBranch,
  hasNewCommitsSinceTag,
} from "./git.js";
import { logger } from "./logger.js";

export async function publishPackage({
  newTag,
  lastTag,
  packageJson,
  pkg,
}: {
  newTag: string; // version + optional tag prefix
  lastTag: string; // version + optional tag prefix
  packageJson: PackageJson;
  pkg: ReleasePackage;
}): Promise<void> {
  logger(`Processing tag release (${newTag}) for ${packageJson.name}...`);
  if (await checkTagExists(newTag)) {
    logger(`Skipping ${packageJson.name}: tag ${newTag} already exists.`);
    return;
  }
  await ensureMainBranch();

  // Special handling for repositories with no existing tags
  if (lastTag === "0.0.0") {
    logger("No previous tags found. This will be the first release.");
  } else if (!hasNewCommitsSinceTag(lastTag, pkg.directory)) {
    logger(`No new commits since ${lastTag}, skipping release.`);
    return;
  }

  // Ask user if they want to publish with default "Yes"
  const { shouldPublish } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldPublish",
      message: `Publish ${packageJson.name} with tag ${newTag}?`,
      default: true, // Default to Yes
    },
  ]);

  if (!shouldPublish) {
    logger(`Skipping release of ${packageJson.name}`);
    return;
  }

  logger(`Releasing ${packageJson.name}...`);
  createGitTag(newTag, pkg.directory);
}

export async function zipFolders({
  newTag,
  packageJson,
  foldersToZip,
}: {
  newTag: string;
  lastTag: string;
  packageJson: PackageJson;
  pkg: ReleasePackage;
  foldersToZip: {
    input: string;
    output: string;
  }[];
}): Promise<void> {
  if (foldersToZip.length > 0) {
    logger("Starting to zip folders");

    for (const zipConfig of foldersToZip) {
      const inputPath = resolve(process.cwd(), zipConfig.input);

      // Process template variables in output filename
      let outputFileName = basename(zipConfig.output);
      outputFileName = outputFileName
        .replace(/%NAME%/g, packageJson.name)
        .replace(/%VERSION%/g, newTag)
        .replace(
          /%TIMESTAMP%/g,
          new Date()
            .toISOString()
            .replace(/[:.T]/g, "-")
            .split("-")
            .slice(0, 6)
            .join("-"),
        );

      const outputDir = dirname(resolve(process.cwd(), zipConfig.output));
      const outputPath = join(outputDir, outputFileName);

      // Ensure output directory exists
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      if (!existsSync(inputPath)) {
        throw new Error(`Input folder ${inputPath} does not exist, cannot zip`);
      }

      try {
        // Create a file to stream archive data to
        const output = createWriteStream(outputPath);
        const archive = archiver("zip", {
          zlib: { level: 9 }, // Maximum compression level
        });

        // Listen for all archive data to be written
        await new Promise<void>((resolve, reject) => {
          output.on("close", () => {
            logger(
              `Successfully zipped ${inputPath} to ${outputPath} (${archive.pointer()} total bytes)`,
            );
            resolve();
          });

          archive.on("warning", (err) => {
            if (err.code === "ENOENT") {
              // Log warning
              logger(`Warning while zipping: ${err.message}`);
            } else {
              // Throw error
              reject(err);
            }
          });

          archive.on("error", (err) => {
            reject(err);
          });

          // Pipe archive data to the file
          archive.pipe(output);

          // Add the directory to the archive
          archive.directory(inputPath, false);

          // Finalize the archive
          archive.finalize().then(resolve, reject);
        });
      } catch (error) {
        logger(
          `Error zipping folder ${inputPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    logger("Finished zipping folders");
  } else {
    logger("No folders to zip in your config");
  }
}
