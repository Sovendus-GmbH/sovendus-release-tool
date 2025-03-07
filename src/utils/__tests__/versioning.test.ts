import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ReleasePackage } from "../../types/index.js";
import { logger } from "../logger.js";
import { updateVariableStringValue } from "../versioning.js";

// Mock the fs module
vi.mock("node:fs", () => {
  return {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});

// Import the mocked fs module
import { readFileSync, writeFileSync } from "node:fs";

// Mock the logger
vi.mock("../logger.js", () => ({
  logger: vi.fn(),
}));

describe("updateVariableStringValue", () => {
  const newVersion = "1.5.0";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("TypeScript/JavaScript files", () => {
    it("should update version in TS/JS files with const declaration", () => {
      // Mock file content
      const fileContent = `
        // Some comment
        const VERSION = '1.0.0';
        const OTHER_CONST = 'something else';
      `;

      const expectedContent = `
        // Some comment
        const VERSION = '1.5.0';
        const OTHER_CONST = 'something else';
      `;

      // Set up the mock return value
      vi.mocked(readFileSync).mockReturnValue(fileContent);

      const pkg: ReleasePackage = {
        directory: "test-dir",
        version: "1.0.0",
        releaseOptions: {},
        versionBumper: {
          jsVars: [{ filePath: "src/constants.ts", varName: "VERSION" }],
        },
        updateDeps: false,
        lintAndBuild: false,
        test: false,
        release: false,
      };

      updateVariableStringValue(pkg, newVersion);

      // Verify that readFileSync was called correctly
      expect(readFileSync).toHaveBeenCalledWith("src/constants.ts", "utf8");

      // Verify that writeFileSync was called with updated content
      expect(writeFileSync).toHaveBeenCalledWith(
        "src/constants.ts",
        expectedContent,
      );

      // Verify the logger was called
      expect(logger).toHaveBeenCalledWith(
        expect.stringContaining("Updated version"),
      );
    });

    it("should throw error when variable not found in TS/JS file", () => {
      const fileContent = `
        // Some comment
        const SOME_OTHER_VAR = '1.0.0';
      `;

      vi.mocked(readFileSync).mockReturnValue(fileContent);

      const pkg: ReleasePackage = {
        directory: "test-dir",
        version: "1.0.0",
        releaseOptions: {},
        versionBumper: {
          jsVars: [{ filePath: "src/constants.ts", varName: "VERSION" }],
        },
        updateDeps: false,
        lintAndBuild: false,
        test: false,
        release: false,
      };

      expect(() => updateVariableStringValue(pkg, newVersion)).toThrow();
    });

    it("should handle single quotes in TS/JS files", () => {
      const fileContent = "const VERSION = '1.0.0';";
      const expectedContent = "const VERSION = '1.5.0';";

      vi.mocked(readFileSync).mockReturnValue(fileContent);

      const pkg: ReleasePackage = {
        directory: "test-dir",
        version: "1.0.0",
        releaseOptions: {},
        versionBumper: {
          jsVars: [{ filePath: "src/constants.ts", varName: "VERSION" }],
        },
        updateDeps: false,
        lintAndBuild: false,
        test: false,
        release: false,
      };

      updateVariableStringValue(pkg, newVersion);

      expect(writeFileSync).toHaveBeenCalledWith(
        "src/constants.ts",
        expectedContent,
      );
    });

    it("should handle double quotes in TS/JS files", () => {
      const fileContent = 'const VERSION = "1.0.0";';
      const expectedContent = 'const VERSION = "1.5.0";';

      vi.mocked(readFileSync).mockReturnValue(fileContent);

      const pkg: ReleasePackage = {
        directory: "test-dir",
        version: "1.0.0",
        releaseOptions: {},
        versionBumper: {
          jsVars: [{ filePath: "src/constants.ts", varName: "VERSION" }],
        },
        updateDeps: false,
        lintAndBuild: false,
        test: false,
        release: false,
      };

      updateVariableStringValue(pkg, newVersion);

      expect(writeFileSync).toHaveBeenCalledWith(
        "src/constants.ts",
        expectedContent,
      );
    });
  });

  describe("PHP files", () => {
    it("should update version in PHP define statements", () => {
      // Mock file content
      const fileContent = `<?php
define('VERSION', '1.0.0');
define('OTHER_CONSTANT', 'something else');
define('SOVENDUS_VERSION', '2.1.0');
`;

      // Set up the mock return value - need to return the original content
      // and then the updated content for the second read
      vi.mocked(readFileSync).mockReturnValueOnce(fileContent)
        .mockReturnValueOnce(`<?php
define('VERSION', '1.5.0');
define('OTHER_CONSTANT', 'something else');
define('SOVENDUS_VERSION', '2.1.0');
`);

      const pkg: ReleasePackage = {
        directory: "test-dir",
        version: "1.0.0",
        releaseOptions: {},
        versionBumper: {
          jsVars: [
            { filePath: "src/constants.php", varName: "VERSION" },
            { filePath: "src/constants.php", varName: "SOVENDUS_VERSION" },
          ],
        },
        updateDeps: false,
        lintAndBuild: false,
        test: false,
        release: false,
      };

      updateVariableStringValue(pkg, newVersion);

      // Verify that readFileSync was called twice (once for each variable)
      expect(readFileSync).toHaveBeenCalledTimes(2);
      expect(readFileSync).toHaveBeenNthCalledWith(
        1,
        "src/constants.php",
        "utf8",
      );
      expect(readFileSync).toHaveBeenNthCalledWith(
        2,
        "src/constants.php",
        "utf8",
      );

      // First write should update VERSION
      expect(writeFileSync).toHaveBeenNthCalledWith(
        1,
        "src/constants.php",
        `<?php
define('VERSION', '1.5.0');
define('OTHER_CONSTANT', 'something else');
define('SOVENDUS_VERSION', '2.1.0');
`,
      );

      // Second write should update SOVENDUS_VERSION
      expect(writeFileSync).toHaveBeenNthCalledWith(
        2,
        "src/constants.php",
        `<?php
define('VERSION', '1.5.0');
define('OTHER_CONSTANT', 'something else');
define('SOVENDUS_VERSION', '1.5.0');
`,
      );

      // Verify the logger was called twice
      expect(logger).toHaveBeenCalledTimes(2);
    });

    it("should throw error when variable not found in PHP file", () => {
      const fileContent = `<?php
define('SOME_OTHER_VAR', '1.0.0');
?>`;

      vi.mocked(readFileSync).mockReturnValue(fileContent);

      const pkg: ReleasePackage = {
        directory: "test-dir",
        version: "1.0.0",
        releaseOptions: {},
        versionBumper: {
          jsVars: [{ filePath: "src/constants.php", varName: "VERSION" }],
        },
        updateDeps: false,
        lintAndBuild: false,
        test: false,
        release: false,
      };

      expect(() => updateVariableStringValue(pkg, newVersion)).toThrow();
    });

    it("should handle PHP define with different spacing", () => {
      const fileContent = `<?php
define("VERSION",'1.0.0');
?>`;
      const expectedContent = `<?php
define("VERSION",'1.5.0');
?>`;

      vi.mocked(readFileSync).mockReturnValue(fileContent);

      const pkg: ReleasePackage = {
        directory: "test-dir",
        version: "1.0.0",
        releaseOptions: {},
        versionBumper: {
          jsVars: [{ filePath: "src/constants.php", varName: "VERSION" }],
        },
        updateDeps: false,
        lintAndBuild: false,
        test: false,
        release: false,
      };

      updateVariableStringValue(pkg, newVersion);

      expect(writeFileSync).toHaveBeenCalledWith(
        "src/constants.php",
        expectedContent,
      );
    });

    it("should handle mixed quotes in PHP define statements", () => {
      const fileContent = `<?php
define('VERSION', "1.0.0");
?>`;
      const expectedContent = `<?php
define('VERSION', "1.5.0");
?>`;

      vi.mocked(readFileSync).mockReturnValue(fileContent);

      const pkg: ReleasePackage = {
        directory: "test-dir",
        version: "1.0.0",
        releaseOptions: {},
        versionBumper: {
          jsVars: [{ filePath: "src/constants.php", varName: "VERSION" }],
        },
        updateDeps: false,
        lintAndBuild: false,
        test: false,
        release: false,
      };

      updateVariableStringValue(pkg, newVersion);

      expect(writeFileSync).toHaveBeenCalledWith(
        "src/constants.php",
        expectedContent,
      );
    });
  });

  it("should update multiple files", () => {
    const tsFileContent = 'const VERSION = "1.0.0";';
    const phpFileContent = 'define("VERSION", "1.0.0");';

    vi.mocked(readFileSync)
      .mockReturnValueOnce(tsFileContent)
      .mockReturnValueOnce(phpFileContent);

    const pkg: ReleasePackage = {
      directory: "test-dir",
      version: "1.0.0",
      releaseOptions: {},
      versionBumper: {
        jsVars: [
          { filePath: "src/constants.ts", varName: "VERSION" },
          { filePath: "src/constants.php", varName: "VERSION" },
        ],
      },
      updateDeps: false,
      lintAndBuild: false,
      test: false,
      release: false,
    };

    updateVariableStringValue(pkg, newVersion);

    expect(writeFileSync).toHaveBeenCalledTimes(2);
    expect(logger).toHaveBeenCalledTimes(2);
  });
});
