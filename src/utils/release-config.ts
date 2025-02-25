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

  let config: ReleaseConfig;
  if (resolvedConfigPath.endsWith(".ts")) {
    // Use dynamic import with a require fallback for .ts files
    try {
      const module = (await import(`file://${resolvedConfigPath}`)) as {
        default: ReleaseConfig;
      };
      config = module.default;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Fallback to require if dynamic import fails (e.g., in CJS environments)

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module = require(resolvedConfigPath) as { default: ReleaseConfig };
      config = module.default;
    }
  } else {
    // Directly import .js files
    const module = (await import(`file://${resolvedConfigPath}`)) as {
      default: ReleaseConfig;
    };
    config = module.default;
  }

  if (!config || !Array.isArray(config.packages)) {
    throw new Error(
      "Invalid config format. Ensure the config exports a default object with a 'packages' array. Check the docs for more info.",
    );
  }
  return config;
}
