import { User } from './user.model';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds (15 min = 900)
}