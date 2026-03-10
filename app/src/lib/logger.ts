type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  environment: string;
  [key: string]: unknown;
}

const SERVICE_NAME = process.env.SERVICE_NAME || "halo-app";
const ENVIRONMENT = process.env.NODE_ENV || "development";

/**
 * Structured JSON logger for production observability.
 * Outputs structured JSON to stdout/stderr for log aggregation.
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: SERVICE_NAME,
    environment: ENVIRONMENT,
    ...context,
  };
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    console.log(JSON.stringify(createLogEntry("info", message, context)));
  },

  warn(message: string, context?: Record<string, unknown>) {
    console.warn(JSON.stringify(createLogEntry("warn", message, context)));
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const errorInfo =
      error instanceof Error
        ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
        : { errorMessage: String(error) };

    console.error(
      JSON.stringify(createLogEntry("error", message, { ...errorInfo, ...context }))
    );
  },

  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.debug(JSON.stringify(createLogEntry("debug", message, context)));
    }
  },
};
