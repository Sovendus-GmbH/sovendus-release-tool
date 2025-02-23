import { Command } from "commander";

import { release } from "./commands/release";

const program = new Command();

program
  .version("1.0.0")
  .description("CLI tool for managing releases of packages")
  .argument("<new_version_number>", "The new version number to release")
  .action((newVersionNumber) => {
    release(newVersionNumber)
      .then(() => {
        console.log("Release process completed successfully.");
      })
      .catch((error) => {
        console.error("Error during release process:", error);
      });
  });

program.parse(process.argv);
