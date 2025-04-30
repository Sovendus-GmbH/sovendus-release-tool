import type { ReleaseConfig } from "./src/types/index.js";

const releaseConfig: ReleaseConfig = {
  packages: [
    {
      directory: "./",
      updateDeps: true,
      lint: true,
      build: true,
      test: true,
      release: {
        version: "1.5.0",
        foldersToScanAndBumpThisPackage: [
          // scan the whole dev env folder
          { folder: "../../" },
        ],
      },
    },
  ],
};
export default releaseConfig;
