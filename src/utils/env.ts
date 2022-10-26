export function isNode(): boolean {
    return process?.version !== undefined;
}
