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
    window
  } catch (error) {
    hasNoWindow = false
  }

  return hasNodeVersion && hasNoWindow
}

export type JSExecutionEnvironment = 'node' | 'browser'
