export function isNode(): boolean {
    return typeof window === undefined && process?.version !== undefined;
}
