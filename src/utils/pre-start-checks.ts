import { ensureMainBranch, handleUncommittedChanges } from "./git.js";

export async function runPrePublishChecks(): Promise<void> {
  await handleUncommittedChanges();
  await ensureMainBranch();
}
