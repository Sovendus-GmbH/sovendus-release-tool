import type { BuildConfig } from "sovendus-builder";

const buildConfig: BuildConfig = {
  foldersToClean: ["dist"],
  filesToCompile: [
    {
      input: "src/index.ts",
      output: "dist/index",
      options: {
        type: "vanilla",
        packageConfig: {
          dtsEntryRoot: "src",
          dtsInclude: ["src/**/*"],
          isPackage: true,
        },
      },
    },
  ],
};

export default buildConfig;
