#!/usr/bin/env node
import { release } from "./commands/release.js";
import { logger, loggerError } from "./utils/logger.js";

release()
  .then(() => {
    logger("Release process completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    loggerError("Error during release process:", error);
  });

export type {
  PackageJson,
  ReleaseConfig,
  ReleaseOptions,
  ReleasePackage,
} from "./types/index.js";
