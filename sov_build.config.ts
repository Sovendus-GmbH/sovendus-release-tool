import type { BuildConfig } from "sovendus-builder";

const buildConfig: BuildConfig = {
  foldersToClean: ["dist"],
  filesToCompile: [
    {
      sovOptions: {
        input: "src/index.ts",
        output: "dist/index",
        type: "vanilla",
        modulesToExternalize: [
          "inquirer",
          "node:child_process",
          "node:fs",
          "node:path",
          "node:url",
          "path",
          "fs",
          "archiver",
          "url",
          "child_process",
          "fsevents",
          "vite",
        ],
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
