export function compareVersions(a: string, b: string): number {
  const [ma, mi, pa] = a.split(".").map(Number);
  const [mb, mm, pb] = b.split(".").map(Number);
  if (ma !== mb) {
    return ma - mb;
  }
  if (mi !== mm) {
    return mi - mm;
  }
  return pa - pb;
}

export function bumpVersion(
  currentVersion: string,
  increment: "patch" | "minor" | "major",
): string {
  const versionParts = currentVersion.split(".").map(Number);
  if (versionParts.length !== 3) {
    throw new Error("Invalid version format");
  }

  switch (increment) {
    case "major":
      versionParts[0] = (versionParts[0] ?? 0) + 1;
      versionParts[1] = 0;
      versionParts[2] = 0;
      break;
    case "minor":
      versionParts[1] = (versionParts[1] ?? 0) + 1;
      versionParts[2] = 0;
      break;
    case "patch":
      versionParts[2] = (versionParts[2] ?? 0) + 1;
      break;
  }

  return versionParts.join(".");
}
