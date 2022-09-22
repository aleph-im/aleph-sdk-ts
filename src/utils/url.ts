/**
 * Strips any remaining trailing slashes or whitespaces at the end of a provided url
 *
 * @param  {string} url
 */
export function stripTrailingSlash(url: string) {
    return url.replace(/\/*\s*$/gi, "");
}

/**
 * Returns the content of the ALEPH_API_UNIX_SOCKET environment variable
 * or undefined.
 */
export function getSocketPath() {
    try {
        return process?.env?.ALEPH_API_UNIX_SOCKET;
    } catch {
        return undefined;
    }
}
