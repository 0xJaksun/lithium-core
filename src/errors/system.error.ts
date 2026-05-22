export class SystemError extends Error {
  public readonly kind = "SystemError" as const;

  constructor(message: string) {
    super(message);
    this.name = "SystemError";
  }
}
