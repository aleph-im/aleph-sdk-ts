/**
 * Detects if the script is running inside Node.js or the browser. Checks
 * if there is Node version in the environnement variable
 * AND
 * if window is already defined
 */
export function isNode(): boolean {
    const hasNodeVersion = process?.version !== undefined;
    let hasNoWindow = true;

    try {
        // should fail in strict mode
        const window = {};
        window;
    } catch (error) {
        hasNoWindow = false;
    }

    return hasNodeVersion && hasNoWindow;
}

export type JSExecutionEnvironment = "node" | "browser";
