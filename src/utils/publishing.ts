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

  try {
    execSync(`cd ${packagePath} && git commit -am "Release ${newVersion}"`, {
      stdio: "inherit",
    });
  } catch (err) {
    const errorOutput = (err as Error).toString();
    if (errorOutput.includes("nothing to commit")) {
      console.log("No changes detected, skipping git commit.");
    } else {
      throw err;
    }
  }

  execSync(`cd ${packagePath} && git tag ${tagPrefix}${newVersion}`, {
    stdio: "inherit",
  });
  execSync(
    `cd ${packagePath} && git push && git push origin ${tagPrefix}${newVersion}`,
    { stdio: "inherit" },
  );
};
