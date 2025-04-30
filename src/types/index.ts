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

export type FoldersToZip = {
  input: string;
  output: string;
}[];

export interface ReleasePackage {
  directory: string;
  updateDeps: true | false | "force";
  lint: boolean;
  build: boolean;
  test: boolean;
  release: ReleaseOptions | false;
}

export type AllowedVersionBumperExtension = "php" | "ts";
export type VersionBumperFileName =
  `${string}.${AllowedVersionBumperExtension}`;

export interface ReleaseOptions {
  version: string;
  tagPrefix?: string;
  foldersToZip?: FoldersToZip;
  versionBumper?: {
    filePath: VersionBumperFileName;
    varName: string;
  }[];
  foldersToScanAndBumpThisPackage?: {
    folder: string;
  }[];
}
