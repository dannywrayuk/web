/* eslint-disable @typescript-eslint/no-explicit-any */

import { type Result, ok, err } from "@dannywrayuk/results";

export type LoginRequest = {
  code: string;
};

export const validateLoginRequest = (
  obj?: Record<string, any>
): Result<LoginRequest> => {
  if (typeof obj?.code !== "string") {
  return err(null, "validating code, expected string");
}
  
  return ok(obj as LoginRequest);
};

export type LoginResponse_Cookies = {
  refresh_token: string;
};

export const validateLoginResponse_Cookies = (
  obj?: Record<string, any>
): Result<LoginResponse_Cookies> => {
  if (typeof obj?.refresh_token !== "string") {
  return err(null, "validating refresh_token, expected string");
}
  
  return ok(obj as LoginResponse_Cookies);
};

export type LoginResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: string;
  cookies?: LoginResponse_Cookies;
};

export const validateLoginResponse = (
  obj?: Record<string, any>
): Result<LoginResponse> => {
  if (typeof obj?.access_token !== "string" && typeof obj?.access_token !== "undefined") {
  return err(null, "validating access_token, expected optional string");
}
  if (typeof obj?.token_type !== "string" && typeof obj?.token_type !== "undefined") {
  return err(null, "validating token_type, expected optional string");
}
  if (typeof obj?.expires_in !== "string" && typeof obj?.expires_in !== "undefined") {
  return err(null, "validating expires_in, expected optional string");
}
  if (validateLoginResponse_Cookies(obj?.cookies)[1] && typeof obj?.cookies !== "undefined") {
  return err(null, "validating cookies, expected optional LoginResponse_Cookies");
}
  
  return ok(obj as LoginResponse);
};

export type Login = (request: LoginRequest) => Promise<Result<LoginResponse>>;

export type None = Record<string, never>;

export const validateNone = (
  obj?: Record<string, any>
): Result<None> => {
  
  return ok(obj as None);
};

export type None = Record<string, never>;

export const validateNone = (
  obj?: Record<string, any>
): Result<None> => {
  
  return ok(obj as None);
};

export type Logout = (request: None) => Promise<Result<None>>;

export type RegisterRequest = {
  code: string;
};

export const validateRegisterRequest = (
  obj?: Record<string, any>
): Result<RegisterRequest> => {
  if (typeof obj?.code !== "string") {
  return err(null, "validating code, expected string");
}
  
  return ok(obj as RegisterRequest);
};

export type RegisterResponse_Cookies = {
  refresh_token: string;
};

export const validateRegisterResponse_Cookies = (
  obj?: Record<string, any>
): Result<RegisterResponse_Cookies> => {
  if (typeof obj?.refresh_token !== "string") {
  return err(null, "validating refresh_token, expected string");
}
  
  return ok(obj as RegisterResponse_Cookies);
};

export type RegisterResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: string;
  cookies?: RegisterResponse_Cookies;
};

export const validateRegisterResponse = (
  obj?: Record<string, any>
): Result<RegisterResponse> => {
  if (typeof obj?.access_token !== "string" && typeof obj?.access_token !== "undefined") {
  return err(null, "validating access_token, expected optional string");
}
  if (typeof obj?.token_type !== "string" && typeof obj?.token_type !== "undefined") {
  return err(null, "validating token_type, expected optional string");
}
  if (typeof obj?.expires_in !== "string" && typeof obj?.expires_in !== "undefined") {
  return err(null, "validating expires_in, expected optional string");
}
  if (validateRegisterResponse_Cookies(obj?.cookies)[1] && typeof obj?.cookies !== "undefined") {
  return err(null, "validating cookies, expected optional RegisterResponse_Cookies");
}
  
  return ok(obj as RegisterResponse);
};

export type Register = (request: RegisterRequest) => Promise<Result<RegisterResponse>>;

export type RefreshRequest_Cookies = {
  refresh_token: string;
};

export const validateRefreshRequest_Cookies = (
  obj?: Record<string, any>
): Result<RefreshRequest_Cookies> => {
  if (typeof obj?.refresh_token !== "string") {
  return err(null, "validating refresh_token, expected string");
}
  
  return ok(obj as RefreshRequest_Cookies);
};

export type RefreshRequest = {
  cookies?: RefreshRequest_Cookies;
};

export const validateRefreshRequest = (
  obj?: Record<string, any>
): Result<RefreshRequest> => {
  if (validateRefreshRequest_Cookies(obj?.cookies)[1] && typeof obj?.cookies !== "undefined") {
  return err(null, "validating cookies, expected optional RefreshRequest_Cookies");
}
  
  return ok(obj as RefreshRequest);
};

export type RefreshResponse_Cookies = {
  refresh_token: string;
};

export const validateRefreshResponse_Cookies = (
  obj?: Record<string, any>
): Result<RefreshResponse_Cookies> => {
  if (typeof obj?.refresh_token !== "string") {
  return err(null, "validating refresh_token, expected string");
}
  
  return ok(obj as RefreshResponse_Cookies);
};

export type RefreshResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: string;
  cookies?: RefreshResponse_Cookies;
};

export const validateRefreshResponse = (
  obj?: Record<string, any>
): Result<RefreshResponse> => {
  if (typeof obj?.access_token !== "string" && typeof obj?.access_token !== "undefined") {
  return err(null, "validating access_token, expected optional string");
}
  if (typeof obj?.token_type !== "string" && typeof obj?.token_type !== "undefined") {
  return err(null, "validating token_type, expected optional string");
}
  if (typeof obj?.expires_in !== "string" && typeof obj?.expires_in !== "undefined") {
  return err(null, "validating expires_in, expected optional string");
}
  if (validateRefreshResponse_Cookies(obj?.cookies)[1] && typeof obj?.cookies !== "undefined") {
  return err(null, "validating cookies, expected optional RefreshResponse_Cookies");
}
  
  return ok(obj as RefreshResponse);
};

export type Refresh = (request: RefreshRequest) => Promise<Result<RefreshResponse>>;