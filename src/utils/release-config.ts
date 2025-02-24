import { existsSync } from "node:fs";
import { resolve } from "node:path";

import type { ReleaseConfig } from "../types/index.js";
import { logger } from "./logger.js";

export const DEFAULT_CONFIG_PATH = "sov_release.config.ts";

/**
 * Loads and returns the release configuration.
 */
export async function loadConfig(configPath: string): Promise<ReleaseConfig> {
  logger(`Using config file: ${configPath}`);
  const resolvedConfigPath = resolve(process.cwd(), configPath);

  if (!existsSync(resolvedConfigPath)) {
    throw new Error(`Config file not found: ${resolvedConfigPath}`);
  }

  const module = (await import(`file://${resolvedConfigPath}`)) as {
    default: ReleaseConfig;
  };
  const config = module.default;
  if (!config || !Array.isArray(config.packages)) {
    throw new Error(
      "Invalid config format. Ensure the config exports a default object with a 'packages' array. Check the docs for more info.",
    );
  }
  return config;
}
