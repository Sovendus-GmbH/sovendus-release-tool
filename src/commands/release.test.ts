import { execSync } from "child_process";
import { existsSync } from "fs";
import { copy, remove } from "fs-extra";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { bumpVersion } from "../utils/versioning";
import { release } from "./release";

const projectRoot = process.cwd();
const unpatchedDir = path.join(projectRoot, "test-files", "unpatched");
const patchedDir = path.join(projectRoot, "test-files", "patched");
const configFilename = "test_release.config.ts"; // relative to patchedDir

// Start with an initial version. Each test bumps it.
let currentTestVersion = "2.0.0";

async function setupPatchedDir() {
  // Remove any existing patched folder then copy over from unpatched
  if (existsSync(patchedDir)) {
    await remove(patchedDir);
  }
  await copy(unpatchedDir, patchedDir);

  // Initialize a new git repository in patchedDir
  execSync("git init", { cwd: patchedDir, stdio: "ignore" });
  // Configure git so that commits can be made
  execSync('git config user.email "test@example.com"', {
    cwd: patchedDir,
    stdio: "ignore",
  });
  execSync('git config user.name "Test User"', {
    cwd: patchedDir,
    stdio: "ignore",
  });
  // Make an initial commit so that subsequent commit commands work
  execSync("git add .", { cwd: patchedDir, stdio: "ignore" });
  execSync('git commit -m "Initial commit"', {
    cwd: patchedDir,
    stdio: "ignore",
  });
}

describe("release integration tests (no mocks)", () => {
  beforeEach(async () => {
    await setupPatchedDir();
    // Change into our patched directory for the release process
    process.chdir(patchedDir);
  });

  afterEach(async () => {
    // Return to project root so that further tests are isolated.
    process.chdir(projectRoot);
    // Optional: remove the patched dir after each test
    await remove(patchedDir);
  });

  it("processes release when tag does not exist", async () => {
    // Use the current test version and bump for next run
    const releaseVersion = currentTestVersion;
    currentTestVersion = bumpVersion(releaseVersion, "patch");

    // Call release with the config file from patchedDir
    await release(releaseVersion, configFilename);

    // In our config, packages with release flag true use tag prefix "test_"
    const expectedTag = `test_${releaseVersion}`;
    // Check via git tag command
    const tagsOutput = execSync(`git tag --list ${expectedTag}`, {
      cwd: patchedDir,
      encoding: "utf8",
    }).trim();
    expect(tagsOutput).toBe(expectedTag);
  });

  it("skips release for packages when tag already exists", async () => {
    // First run to create the tag
    const releaseVersion = currentTestVersion;
    currentTestVersion = bumpVersion(releaseVersion, "patch");

    await release(releaseVersion, configFilename);

    // Now run the same release again; packages with the same version should be skipped.
    await release(releaseVersion, configFilename);

    // The expected tag should still exist (only one commit/tag should have been created)
    const expectedTag = `test_${releaseVersion}`;
    const tagsOutput = execSync(`git tag --list ${expectedTag}`, {
      cwd: patchedDir,
      encoding: "utf8",
    }).trim();
    expect(tagsOutput).toBe(expectedTag);
  });
});
