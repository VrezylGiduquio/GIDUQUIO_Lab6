import { Response } from 'express';

import { env } from '../config/env';

const maxAge = env.refreshTokenTtlDays * 24 * 60 * 60 * 1000;

export function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge,
    path: '/'
  });
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/'
  });
}
