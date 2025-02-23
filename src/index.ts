import { release } from "./commands/release.js";
import { logger, loggerError } from "./utils/logger.js";

release()
  .then(() => {
    logger("Release process completed successfully.");
  })
  .catch((error) => {
    loggerError("Error during release process:", error);
  });
