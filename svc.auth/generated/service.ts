/* eslint-disable @typescript-eslint/no-explicit-any */
import { ok, err, type Result } from "@dannywrayuk/results";
import {
  methodHandler,
  type HandlerContext,
} from "@dannywrayuk/service-platform/methodHandler";
import { methodHttpHandler } from "@dannywrayuk/service-platform/methodHttpHandler";
type Empty = Record<string, never>;
const validateEmpty = (o: Record<string, any>): Result<Empty> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "Empty is not an object");
  }
  return ok(o as Empty);
};

export type CommonEnv = {
  domain: "dannywray.co.uk";
  accessTokenExpiry: "3600";
  refreshTokenExpiry: "25920000";
} & { stage: string };
export type Env_dev = {
  githubUrl: "https://mock.dannywray.co.uk/github.com";
  githubApiUrl: "https://mock.dannywray.co.uk/api.github.com";
  allowedOrigins: [
    "http://localhost:5173",
    "https://account.dev.dannywray.co.uk",
  ];
} & { stage: "dev" };
export type Env_prod = {
  githubUrl: "https://github.com";
  githubApiUrl: "https://api.github.com";
  allowedOrigins: ["https://account.dannywray.co.uk"];
  removeStageSubdomain: true;
  deletionProtection: true;
} & { stage: "prod" };
export type Env = CommonEnv & (Env_dev | Env_prod);

export type TokenRequest = { code: string };
export const validateTokenRequest = (
  o: Record<string, any>,
): Result<TokenRequest> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "TokenRequest is not an object");
  }
  if (typeof o.code !== "string") {
    return err(null, "code is not a string");
  }
  return ok(o as TokenRequest);
};
export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: string;
};
export const validateTokenResponse = (
  o: Record<string, any>,
): Result<TokenResponse> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "TokenResponse is not an object");
  }
  if (typeof o.access_token !== "string") {
    return err(null, "access_token is not a string");
  }
  if (typeof o.refresh_token !== "string") {
    return err(null, "refresh_token is not a string");
  }
  if (typeof o.token_type !== "string") {
    return err(null, "token_type is not a string");
  }
  if (typeof o.expires_in !== "string") {
    return err(null, "expires_in is not a string");
  }
  return ok(o as TokenResponse);
};
export type LoginRequest_Query = { code: string };
export const validateLoginRequest_Query = (
  o: Record<string, any>,
): Result<LoginRequest_Query> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "LoginRequest_Query is not an object");
  }
  if (typeof o.code !== "string") {
    return err(null, "code is not a string");
  }
  return ok(o as LoginRequest_Query);
};
export type LoginRequest = { queryz: LoginRequest_Query };
export const validateLoginRequest = (
  o: Record<string, any>,
): Result<LoginRequest> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "LoginRequest is not an object");
  }

  const [, queryzError] = validateLoginRequest_Query(o.queryz);
  if (queryzError) {
    return err(queryzError, "queryz is not valid");
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
  access_token: string;
  token_type: string;
  expires_in: string;
  cookies: LoginResponse_Cookies;
};
export const validateLoginResponse = (
  o: Record<string, any>,
): Result<LoginResponse> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "LoginResponse is not an object");
  }
  if (typeof o.access_token !== "string") {
    return err(null, "access_token is not a string");
  }
  if (typeof o.token_type !== "string") {
    return err(null, "token_type is not a string");
  }
  if (typeof o.expires_in !== "string") {
    return err(null, "expires_in is not a string");
  }

  const [, cookiesError] = validateLoginResponse_Cookies(o.cookies);
  if (cookiesError) {
    return err(cookiesError, "cookies is not valid");
  }
  return ok(o as LoginResponse);
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
export type RefreshRequest = { cookies: RefreshRequest_Cookies };
export const validateRefreshRequest = (
  o: Record<string, any>,
): Result<RefreshRequest> => {
  if (typeof o !== "object" || o === null) {
    return err(null, "RefreshRequest is not an object");
  }

  const [, cookiesError] = validateRefreshRequest_Cookies(o.cookies);
  if (cookiesError) {
    return err(cookiesError, "cookies is not valid");
  }
  return ok(o as RefreshRequest);
};
export const marshalHttpToLoginRequest = (event: any) => {
  return {
    ...event.body,
    queryz: fromHttpQuery(event.query),
  };
};
export const unmarshalLoginResponseToHttp = (response: any) => {
  const { cookies: cookies, ...body } = response;
  return {
    body,
    cookies: toHttpCookies(cookies),
  };
};
export const marshalHttpToRefreshRequest = (event: any) => {
  return {
    ...event.body,
    cookies: fromHttpCookies(event.cookies),
  };
};
export const tokenMethodSecrets = [
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "AUTH_ACCESS_TOKEN_SIGNING_KEY",
  "AUTH_REFRESH_TOKEN_SIGNING_KEY",
] as const;
export const tokenMethod = (
  handler: (
    event: TokenRequest,
    context: HandlerContext<Env, typeof tokenMethodSecrets>,
  ) => Promise<Result<TokenResponse>>,
) => {
  return methodHandler(handler, validateTokenRequest, validateTokenResponse);
};

export const loginMethod = (
  handler: (
    event: LoginRequest,
    context: HandlerContext<Env, []>,
  ) => Promise<Result<LoginResponse>>,
) => {
  return methodHttpHandler(
    handler,
    validateLoginRequest,
    validateLoginResponse,
    marshalHttpToLoginRequest,
    unmarshalLoginResponseToHttp,
  );
};

export const registerMethod = (
  handler: (
    event: LoginRequest,
    context: HandlerContext<Env, []>,
  ) => Promise<Result<LoginResponse>>,
) => {
  return methodHttpHandler(
    handler,
    validateLoginRequest,
    validateLoginResponse,
    marshalHttpToLoginRequest,
    unmarshalLoginResponseToHttp,
  );
};

export const refreshMethod = (
  handler: (
    event: RefreshRequest,
    context: HandlerContext<Env, []>,
  ) => Promise<Result<LoginResponse>>,
) => {
  return methodHttpHandler(
    handler,
    validateRefreshRequest,
    validateLoginResponse,
    marshalHttpToRefreshRequest,
    unmarshalLoginResponseToHttp,
  );
};

export const logoutMethod = (
  handler: (
    event: Empty,
    context: HandlerContext<Env, []>,
  ) => Promise<Result<Empty>>,
) => {
  return methodHttpHandler(handler, validateEmpty, validateEmpty, null, null);
};

