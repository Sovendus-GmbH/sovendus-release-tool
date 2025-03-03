export interface PackageJson {
  name: string;
  version: string;
  scripts?: { [key: string]: string };
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
  peerDependencies?: { [key: string]: string };
  updateIgnoreDependencies?: string[];
}

export interface ReleaseConfig {
  packageManager?: "npm" | "yarn" | "pnpm" | "deno";
  packages: ReleasePackage[];
  globalVersion?: string;
}

export interface ReleasePackage {
  directory: string;
  version?: string;
  updateDeps: boolean;
  lintAndBuild: boolean;
  test: boolean;
  versionBumper?: {
    jsVars: {
      filePath: string;
      varName: string;
    }[];
  };
  release: boolean;
  releaseOptions?: ReleaseOptions;
}

export interface ReleaseOptions {
  tagPrefix?: string;
  foldersToScanAndBumpThisPackage?: {
    folder: string;
  }[];
}
