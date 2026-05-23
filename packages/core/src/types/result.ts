export type Result<T, E extends Error> =
  | { success: true; value: T }
  | { success: false; error: E };
