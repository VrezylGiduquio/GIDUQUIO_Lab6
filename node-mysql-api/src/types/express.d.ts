import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        sub: string;
        role: 'Admin' | 'User';
        email: string;
      };
    }
  }
}

export {};
