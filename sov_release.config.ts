import type { ReleaseConfig } from "./src/types/index.js";

const releaseConfig: ReleaseConfig = {
  packages: [
    {
      directory: "./",
      version: "1.1.1",
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
