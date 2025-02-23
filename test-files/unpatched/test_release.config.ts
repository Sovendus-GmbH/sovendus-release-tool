import type { ReleaseConfig } from "../../src/types";

const releaseConfig: ReleaseConfig = {
  packages: [
    {
      version: "1.0.0",
      directory: "./",
      release: false,
      updateDeps: true,
    },
    {
      version: "1.0.0",
      directory: "sub-package-1",
      updateDeps: true,
      release: true,
      releaseOptions: {
        tagPrefix: "test_",
        foldersToScanAndBumpThisPackage: [{ folder: "sub-package-2" }],
      },
    },
    {
      version: "1.0.0",
      directory: "sub-package-2",
      updateDeps: true,
      release: true,
      releaseOptions: {
        tagPrefix: "test_",
      },
    },
  ],
};

export default releaseConfig;
