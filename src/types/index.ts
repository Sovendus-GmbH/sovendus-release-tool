export interface PackageJson {
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
  release: boolean;
  releaseOptions?: ReleaseOptions;
  updateDeps: boolean;
}

export interface ReleaseOptions {
  tagPrefix?: string;
  foldersToScanAndBumpThisPackage?: {
    folder: string;
  }[];
}
