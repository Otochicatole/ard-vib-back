import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../domain/errors/app-error';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Manejo de errores de validación de Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Error de validación en la petición',
      issues: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Manejo de errores de dominio conocidos
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Error inesperado o de infraestructura no controlado
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Ocurrió un error interno en el servidor',
  });
};
