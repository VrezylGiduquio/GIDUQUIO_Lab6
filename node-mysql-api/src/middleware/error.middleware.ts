import { NextFunction, Request, Response } from 'express';

import { HttpError } from '../utils/http-error';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}
