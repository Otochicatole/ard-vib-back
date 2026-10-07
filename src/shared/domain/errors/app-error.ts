export abstract class AppError extends Error {
  public abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;

  constructor(resource: string, identifier?: string) {
    super(identifier ? `${resource} con identificador '${identifier}' no fue encontrado.` : `${resource} no encontrado.`);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;

  constructor(message: string) {
    super(message);
  }
}
