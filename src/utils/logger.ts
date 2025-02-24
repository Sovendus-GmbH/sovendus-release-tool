export function logger(message: string): void {
  // eslint-disable-next-line no-console
  console.log(
    `%c[Sovendus-Release-Tool][INFO] ${message}`,
    "color: green; font-size: larger;",
  );
}

export function loggerError(message: string, error: unknown): void {
  // eslint-disable-next-line no-console
  console.error(
    `%c[Sovendus-Release-Tool][ERROR] ${message}`,
    "color: red; font-size: larger;",
    error,
  );
}
