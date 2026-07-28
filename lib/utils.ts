/**
 * Joins class names together, filtering out falsy values.
 */
export function cn(...inputs: Array<string | undefined | null | false>) {
  return inputs.filter(Boolean).join(" ");
}
