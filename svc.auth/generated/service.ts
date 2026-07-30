/* eslint-disable @typescript-eslint/no-explicit-any */
import { ok, err, type Result } from "@dannywrayuk/results";
import {
  methodHandler,
  type HandlerContext,
} from "@dannywrayuk/service-platform/methodHandler";
type Empty = Record<string, never>;
const validateEmpty = (o: Record<string, any>): Result<Empty> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "Empty is not an object");
  }
  return ok(o as Empty);
};

export type LoginRequest = { code: string };
export const validateLoginRequest = (
  o: Record<string, any>,
): Result<LoginRequest> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "LoginRequest is not an object");
  }
  if (typeof o.code !== "string") {
    return err(null, "code is not a string");
  }
  return ok(o as LoginRequest);
};
export type LoginResponse_Cookies = { refresh_token: string };
export const validateLoginResponse_Cookies = (
  o: Record<string, any>,
): Result<LoginResponse_Cookies> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "LoginResponse_Cookies is not an object");
  }
  if (typeof o.refresh_token !== "string") {
    return err(null, "refresh_token is not a string");
  }
  return ok(o as LoginResponse_Cookies);
};
export type LoginResponse = {
  access_token: string | undefined;
  token_type: string | undefined;
  expires_in: string | undefined;
  cookies: LoginResponse_Cookies | undefined;
};
export const validateLoginResponse = (
  o: Record<string, any>,
): Result<LoginResponse> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "LoginResponse is not an object");
  }

  if (o.access_token !== undefined) {
    if (typeof o.access_token !== "string") {
      return err(null, "access_token is not a string");
    }
  }

  if (o.token_type !== undefined) {
    if (typeof o.token_type !== "string") {
      return err(null, "token_type is not a string");
    }
  }

  if (o.expires_in !== undefined) {
    if (typeof o.expires_in !== "string") {
      return err(null, "expires_in is not a string");
    }
  }

  if (o.cookies !== undefined) {
    const [, cookiesError] = validateLoginResponse_Cookies(o.cookies);
    if (cookiesError) {
      return err(cookiesError, "cookies is not valid");
    }
  }
  return ok(o as LoginResponse);
};
export type RegisterRequest = { code: string };
export const validateRegisterRequest = (
  o: Record<string, any>,
): Result<RegisterRequest> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "RegisterRequest is not an object");
  }
  if (typeof o.code !== "string") {
    return err(null, "code is not a string");
  }
  return ok(o as RegisterRequest);
};
export type RegisterResponse_Cookies = { refresh_token: string };
export const validateRegisterResponse_Cookies = (
  o: Record<string, any>,
): Result<RegisterResponse_Cookies> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "RegisterResponse_Cookies is not an object");
  }
  if (typeof o.refresh_token !== "string") {
    return err(null, "refresh_token is not a string");
  }
  return ok(o as RegisterResponse_Cookies);
};
export type RegisterResponse = {
  access_token: string | undefined;
  token_type: string | undefined;
  expires_in: string | undefined;
  cookies: RegisterResponse_Cookies | undefined;
};
export const validateRegisterResponse = (
  o: Record<string, any>,
): Result<RegisterResponse> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "RegisterResponse is not an object");
  }

  if (o.access_token !== undefined) {
    if (typeof o.access_token !== "string") {
      return err(null, "access_token is not a string");
    }
  }

  if (o.token_type !== undefined) {
    if (typeof o.token_type !== "string") {
      return err(null, "token_type is not a string");
    }
  }

  if (o.expires_in !== undefined) {
    if (typeof o.expires_in !== "string") {
      return err(null, "expires_in is not a string");
    }
  }

  if (o.cookies !== undefined) {
    const [, cookiesError] = validateRegisterResponse_Cookies(o.cookies);
    if (cookiesError) {
      return err(cookiesError, "cookies is not valid");
    }
  }
  return ok(o as RegisterResponse);
};
export type RefreshRequest_Cookies = { refresh_token: string };
export const validateRefreshRequest_Cookies = (
  o: Record<string, any>,
): Result<RefreshRequest_Cookies> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "RefreshRequest_Cookies is not an object");
  }
  if (typeof o.refresh_token !== "string") {
    return err(null, "refresh_token is not a string");
  }
  return ok(o as RefreshRequest_Cookies);
};
export type RefreshRequest = { cookies: RefreshRequest_Cookies | undefined };
export const validateRefreshRequest = (
  o: Record<string, any>,
): Result<RefreshRequest> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "RefreshRequest is not an object");
  }

  if (o.cookies !== undefined) {
    const [, cookiesError] = validateRefreshRequest_Cookies(o.cookies);
    if (cookiesError) {
      return err(cookiesError, "cookies is not valid");
    }
  }
  return ok(o as RefreshRequest);
};
export type RefreshResponse_Cookies = { refresh_token: string };
export const validateRefreshResponse_Cookies = (
  o: Record<string, any>,
): Result<RefreshResponse_Cookies> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "RefreshResponse_Cookies is not an object");
  }
  if (typeof o.refresh_token !== "string") {
    return err(null, "refresh_token is not a string");
  }
  return ok(o as RefreshResponse_Cookies);
};
export type RefreshResponse = {
  access_token: string | undefined;
  token_type: string | undefined;
  expires_in: string | undefined;
  cookies: RefreshResponse_Cookies | undefined;
};
export const validateRefreshResponse = (
  o: Record<string, any>,
): Result<RefreshResponse> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "RefreshResponse is not an object");
  }

  if (o.access_token !== undefined) {
    if (typeof o.access_token !== "string") {
      return err(null, "access_token is not a string");
    }
  }

  if (o.token_type !== undefined) {
    if (typeof o.token_type !== "string") {
      return err(null, "token_type is not a string");
    }
  }

  if (o.expires_in !== undefined) {
    if (typeof o.expires_in !== "string") {
      return err(null, "expires_in is not a string");
    }
  }

  if (o.cookies !== undefined) {
    const [, cookiesError] = validateRefreshResponse_Cookies(o.cookies);
    if (cookiesError) {
      return err(cookiesError, "cookies is not valid");
    }
  }
  return ok(o as RefreshResponse);
};

export const loginMethod = async (
  handler: (
    event: LoginRequest,
    context: HandlerContext,
  ) => Promise<Result<LoginResponse>>,
) => {
  return methodHandler(handler, validateLoginRequest, validateLoginResponse);
};
export const logoutMethod = async (
  handler: (event: Empty, context: HandlerContext) => Promise<Result<Empty>>,
) => {
  return methodHandler(handler, validateEmpty, validateEmpty);
};
export const registerMethod = async (
  handler: (
    event: RegisterRequest,
    context: HandlerContext,
  ) => Promise<Result<RegisterResponse>>,
) => {
  return methodHandler(
    handler,
    validateRegisterRequest,
    validateRegisterResponse,
  );
};
export const refreshMethod = async (
  handler: (
    event: RefreshRequest,
    context: HandlerContext,
  ) => Promise<Result<RefreshResponse>>,
) => {
  return methodHandler(
    handler,
    validateRefreshRequest,
    validateRefreshResponse,
  );
};

