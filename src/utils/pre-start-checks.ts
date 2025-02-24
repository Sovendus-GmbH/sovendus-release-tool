import { ensureMainBranch, handleUncommittedChanges } from "./git.js";

export async function runPreStartChecks(): Promise<void> {
  await handleUncommittedChanges();
  ensureMainBranch();
}
