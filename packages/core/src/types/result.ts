import type { ValidationError, NotFoundError, SystemError } from "../errors";

export type Errors = ValidationError | NotFoundError | SystemError;

export type Result<T, E = Errors> =
  | { success: true; value: T }
  | { success: false; error: E };
