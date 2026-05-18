import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';

import { HttpError } from '../utils/http-error';
import { verifyAccessToken } from '../utils/tokens';

export function authorize(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Unauthorized'));
    return;
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token) as JwtPayload & {
      sub: string;
      email: string;
      role: 'Admin' | 'User';
    };

    req.user = payload;
    next();
  } catch {
    next(new HttpError(401, 'Unauthorized'));
  }
}
