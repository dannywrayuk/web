export type LoginRequest = { code: string };
export type LoginResponse_Cookies = { refresh_token: string };
export type LoginResponse = {
  access_token: string | undefined;
  token_type: string | undefined;
  expires_in: string | undefined;
  cookies: LoginResponse_Cookies | undefined;
};
export type RegisterRequest = { code: string };
export type RegisterResponse_Cookies = { refresh_token: string };
export type RegisterResponse = {
  access_token: string | undefined;
  token_type: string | undefined;
  expires_in: string | undefined;
  cookies: RegisterResponse_Cookies | undefined;
};
export type RefreshRequest_Cookies = { refresh_token: string };
export type RefreshRequest = { cookies: RefreshRequest_Cookies | undefined };
export type RefreshResponse_Cookies = { refresh_token: string };
export type RefreshResponse = {
  access_token: string | undefined;
  token_type: string | undefined;
  expires_in: string | undefined;
  cookies: RefreshResponse_Cookies | undefined;
};

