# Sovendus Release Tool

This project is a command-line interface (CLI) tool designed to automate the release process for a set of packages. It handles version bumping, dependency updates, linting, building, and publishing to npm or other channels, while ensuring that already released versions are not published again.

## Features

- Orchestrate the release process for multiple projects with multiple sub packages.
- Bump version numbers for multiple packages.
- Lint, build and test packages before publishing.
- Continue the release process even if some packages failed to build or test in the previous run.
- Publish packages to npm or custom release channels.
- Skip if the version tag already exists and there are no new changes on main.

## Installation

To install the project, clone the repository and run the following commands:

```bash
npm install sovendus-release-tool
```

## Configuration

To configure the release tool, create a `sov_release.config.js` file in the root of your project. The configuration file should export an object with the following properties:

```typescript
// file: sov_release.config.js
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

```

## Usage

To use the release tool, run the following command in your terminal:

in your package.json add the following script:

```json
{
  "scripts": {
    "pub": "sovendus-release-tool"
  }
}
```

Then run the following command:

```bash
yarn pub
```

## Contributing

If you want to contribute or report issues, please follow these steps in our developer guide here: [Developer Guide](./readme-dev.md)
