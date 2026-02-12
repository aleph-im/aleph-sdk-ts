/**
 * Normalizes a value that can be either a string or an array of strings
 * into a comma-separated string suitable for API query parameters.
 *
 * @param value - A string, array of strings, or undefined
 * @returns A comma-separated string if the value has content, undefined otherwise
 */
export const toQueryParam = (value: string | string[] | undefined): string | undefined => {
  if (value === undefined) return undefined
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(',') : undefined
  }
  return value || undefined
}
