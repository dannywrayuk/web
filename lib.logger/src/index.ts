class Logger {
  private logFunctions: Record<string, (...messages: unknown[]) => void> = {
    INFO: console.log,
    WARN: console.warn,
    ERROR: console.error,
    DEBUG: console.debug,
  };
  private logData: Record<string, unknown> = {};
  private debugMode: boolean = false;

  constructor() {}

  log(level: string, message: string, data?: Record<string, unknown> | Error) {
    if (data instanceof Error) {
      data = { message: data.message, error: data.name };
    }
    this.logFunctions[level](
      message,
      JSON.stringify(
        {
          message,
          ...(this.logData || {}),
          ...(data || {}),
          level,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  }

  setLogFunctions(
    logFunctions: Record<string, (...message: unknown[]) => void>,
  ) {
    this.logFunctions = logFunctions;
    return this;
  }

  attach(data: Record<string, unknown>) {
    this.logData = { ...this.logData, ...data };
    return this;
  }

  attachDebug(data: Record<string, unknown>) {
    if (!this.debugMode) return this;
    this.attach(data);
    return this;
  }

  setDebug(mode: boolean) {
    this.debugMode = mode;
    return this;
  }

  debug(message: string, data?: Record<string, unknown> | Error) {
    if (!this.debugMode) return this;
    this.log("DEBUG", message, data);
    return this;
  }
  info(message: string, data?: Record<string, unknown> | Error) {
    this.log("INFO", message, data);
    return this;
  }
  warn(message: string, data?: Record<string, unknown> | Error) {
    this.log("WARN", message, data);
    return this;
  }
  error(message: string, data?: Record<string, unknown> | Error) {
    this.log("ERROR", message, data);
    return this;
  }
}

export const logger = new Logger();
