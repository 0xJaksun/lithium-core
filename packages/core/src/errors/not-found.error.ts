export class NotFoundError extends Error {
  public readonly kind = "NotFoundError" as const;

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
