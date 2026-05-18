import crypto from 'crypto';

import jwt, { SignOptions } from 'jsonwebtoken';

import { env } from '../config/env';

export function generateAccessToken(payload: {
  sub: string;
  email: string;
  role: 'Admin' | 'User';
}) {
  const options: SignOptions = {
    expiresIn: env.accessTokenTtl as SignOptions['expiresIn']
  };

  return jwt.sign(payload, env.jwtSecret, {
    ...options
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.jwtSecret);
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
