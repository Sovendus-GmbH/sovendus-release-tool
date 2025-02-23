export function logger(message: string): void {
  // eslint-disable-next-line no-console
  console.log(`[Sovendus-Release-Tool][INFO] ${message}`);
}

export function loggerError(message: string, error: unknown): void {
  // eslint-disable-next-line no-console
  console.error(`[Sovendus-Release-Tool][ERROR] ${message}`, error);
}
