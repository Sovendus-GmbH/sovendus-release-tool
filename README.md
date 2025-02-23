# Release Tool

This project is a command-line interface (CLI) tool designed to automate the release process for a set of packages. It handles version bumping, dependency updates, linting, building, and publishing to npm, while ensuring that already released versions are not published again.

## Features

- Bump version numbers for multiple packages.
- Lint and build packages before publishing.
- Publish packages to npm.
- Skip publishing if the version tag already exists.

## Installation

To install the project, clone the repository and run the following commands:

```bash
npm install
```

## Usage

To use the release tool, run the following command in your terminal:

```bash
npx release-tool <new_version_number>
```

Replace `<new_version_number>` with the desired version number for the release.

## Commands

- **release**: This command initiates the release process, which includes:
  - Bumping the version of all packages.
  - Linting and building each package.
  - Publishing each package to npm.
  - Creating a new commit and tagging the release.

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push your branch and create a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.