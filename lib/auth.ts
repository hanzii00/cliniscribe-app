export interface User {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}
