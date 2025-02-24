export const publishPackage = (
  packagePath: string,
  newVersion: string,
  tagPrefix: string,
): void => {
  // execSync(`cd ${packagePath} && yarn publish`, { stdio: "inherit" });
  // try {
  //   execSync(`cd ${packagePath} && git commit -am "Release ${newVersion}"`, {
  //     stdio: "inherit",
  //   });
  // } catch (err) {
  //   const errorOutput = (err as Error).toString();
  //   if (errorOutput.includes("nothing to commit")) {
  //     logger("No changes detected, skipping git commit.");
  //   } else {
  //     throw err;
  //   }
  // }
  // execSync(`cd ${packagePath} && git tag ${tagPrefix}${newVersion}`, {
  //   stdio: "inherit",
  // });
  // execSync(
  //   `cd ${packagePath} && git push && git push origin ${tagPrefix}${newVersion}`,
  //   { stdio: "inherit" },
  // );
};
