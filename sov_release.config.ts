import type { ReleaseConfig } from "./src/types/index.js";

const releaseConfig: ReleaseConfig = {
  packages: [
    {
      directory: "./",
      version: "1.3.0",
      release: true,
      updateDeps: true,
      lintAndBuild: true,
      test: true,

      releaseOptions: {
        foldersToScanAndBumpThisPackage: [
          // scan the whole dev env folder
          { folder: "../" },
        ],
      },
    },
  ],
};
export default releaseConfig;
