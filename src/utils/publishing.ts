import { execSync } from "child_process";

export const lintAndBuild = (packagePath: string): void => {
  execSync(`cd ${packagePath} && yarn lint`, { stdio: "inherit" });
  execSync(`cd ${packagePath} && yarn build`, { stdio: "inherit" });
};

export const publishPackage = (
  packagePath: string,
  newVersion: string,
  tagPrefix: string,
): void => {
  execSync(`cd ${packagePath} && npm publish`, { stdio: "inherit" });
  execSync(`cd ${packagePath} && git commit -am "Release ${newVersion}"`, {
    stdio: "inherit",
  });
  execSync(`cd ${packagePath} && git tag ${tagPrefix}${newVersion}`, {
    stdio: "inherit",
  });
  execSync(
    `cd ${packagePath} && git push && git push origin ${tagPrefix}${newVersion}`,
    { stdio: "inherit" },
  );
};

export const publishPackage = (
  packagePath: string,
  newVersion: string,
  tagPrefix: string,
): void => {
  // In test mode, use --dry-run to avoid triggering OTP (while still using NODE_AUTH_TOKEN)
  const isTest = process.env.NODE_ENV === "test";
  const publishCmd = isTest ? "npm publish --dry-run" : "npm publish";

  // Execute the publish command (it will use NODE_AUTH_TOKEN automatically)
  execSync(`cd ${packagePath} && ${publishCmd}`, { stdio: "inherit" });

  // Continue with git commit, tagging and pushing regardless of test mode.
  execSync(`cd ${packagePath} && git commit -am "Release ${newVersion}"`, {
    stdio: "inherit",
  });
  execSync(`cd ${packagePath} && git tag ${tagPrefix}${newVersion}`, {
    stdio: "inherit",
  });
  execSync(
    `cd ${packagePath} && git push && git push origin ${tagPrefix}${newVersion}`,
    { stdio: "inherit" },
  );
};
