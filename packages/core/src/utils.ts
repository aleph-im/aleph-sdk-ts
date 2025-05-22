/**
 * Strips any remaining trailing slashes or whitespaces at the end of a provided url
 *
 * @param  {string} url
 */
export function stripTrailingSlash(url: string): string {
  return url.replace(/\/*\s*$/gi, '')
}

/**
 * Returns the content of the ALEPH_API_UNIX_SOCKET environment variable
 * or undefined.
 */
export function getSocketPath(): string | undefined {
  try {
    return process?.env?.ALEPH_API_UNIX_SOCKET
  } catch {
    return undefined
  }
}

/**
 * Detects if the script is running inside Node.js or the browser. Checks
 * if there is Node version in the environnement variable
 * AND
 * if window is already defined
 */
export function isNode(): boolean {
  const hasNodeVersion = process?.version !== undefined
  let hasNoWindow = true

  try {
    // should fail in strict mode
    const window = {}
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    window
  } catch {
    hasNoWindow = false
  }

  return hasNodeVersion && hasNoWindow
}

export type JSExecutionEnvironment = 'node' | 'browser'

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function gigabyteToMebibyte(n: number): number {
  const mebibyte = 2 ** 20
  const gigabyte = 10 ** 9
  return Math.ceil((n * gigabyte) / mebibyte)
}
