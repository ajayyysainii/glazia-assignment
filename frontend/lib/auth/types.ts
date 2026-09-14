export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = AuthTokens & {
  user: AuthUser;
};

export type ApiErrorBody = {
  success: false;
  statusCode: number;
  code?: string;
  message: string;
  errors?: Record<string, string[] | undefined>;
};
