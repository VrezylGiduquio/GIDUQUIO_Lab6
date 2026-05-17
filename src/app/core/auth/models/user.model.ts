export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'User' | 'Admin';
  verified: boolean;
  password: string;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: number;
}