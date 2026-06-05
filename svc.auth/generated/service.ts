import { Result } from "@dannywrayuk/results";

export type ServiceConfig = {
  	name?: string;
		version?: string;
};

export type None = {
  
};

export type LoginRequest = {
  	code: string;
};

export type LoginResponse = {
  	access_token?: string;
		refresh_token?: string;
};

export type RegisterRequest = {
  	code: string;
};

export type RegisterResponse = {
  	access_token?: string;
		refresh_token?: string;
};

export type RefreshRequest = {
  	code: string;
};

export type RefreshResponse = {
  	access_token?: string;
		refresh_token?: string;
};

export type Login = (request: LoginRequest) => Promise<Result<LoginResponse>>;

export type Logout = (request: None) => Promise<Result<None>>;

export type Register = (request: RegisterRequest) => Promise<Result<RegisterResponse>>;

export type Refresh = (request: RefreshRequest) => Promise<Result<RefreshResponse>>;