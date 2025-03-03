import type { ReleaseConfig } from "./src/types/index.js";

const releaseConfig: ReleaseConfig = {
  packages: [
    {
      directory: "./",
      version: "1.0.26",
      release: true,
      updateDeps: true,
      lintAndBuild: true,
      test: false,

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
