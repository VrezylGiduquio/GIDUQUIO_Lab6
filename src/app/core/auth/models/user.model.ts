export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'User' | 'Admin';
  verified?: boolean | string;
  jwtToken?: string;
}
