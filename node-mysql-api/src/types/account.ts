export type Role = 'Admin' | 'User';

export interface AccountRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: Role;
  verified_at: Date | null;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires_at: Date | null;
}

export interface PublicAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  verified: boolean;
}

export interface AuthPayload extends PublicAccount {
  jwtToken: string;
}
