import { release } from "./commands/release";

release()
  .then(() => {
    console.log("Release process completed successfully.");
  })
  .catch((error) => {
    console.error("Error during release process:", error);
  });
