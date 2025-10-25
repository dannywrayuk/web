import { login, logout, refresh } from "@/api/auth";

export class AuthState {
  private instance: AuthState | null = null;
  private accessToken: string | null = null;
  private expiresAt: number | null = null;
  activeSession: boolean = localStorage.getItem("session") === "true";

  constructor() {
    this.accessToken = null;
    if (!this.instance) {
      this.instance = this;
    }
    return this.instance;
  }

  async login(code: string) {
    const rsp = await login(code);
    if (!rsp) {
      return null;
    }
    this.accessToken = rsp.accessToken;
    this.expiresAt = Date.now() + rsp.expiresIn * 1000;
    localStorage.setItem("session", "true");
  }

  async refresh() {
    if (this.expiresAt && Date.now() < this.expiresAt) {
      return;
    }
    const rsp = await refresh();
    if (!rsp) {
      this.accessToken = null;
      this.expiresAt = null;
      localStorage.removeItem("session");
      return;
    }
    this.accessToken = rsp.accessToken;
    this.expiresAt = Date.now() + rsp.expiresIn * 1000;
  }

  async getAccessToken() {
    if (
      this.accessToken &&
      this.expiresAt &&
      Date.now() < this.expiresAt - 10 * 1000
    ) {
      return this.accessToken;
    }
    await this.refresh();
    return this.accessToken;
  }

  async logout() {
    this.accessToken = null;
    this.expiresAt = null;
    await logout();
    localStorage.removeItem("session");
  }
}
