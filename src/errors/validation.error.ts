export class ValidationError extends Error {
  public readonly kind = "ValidationError" as const;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
