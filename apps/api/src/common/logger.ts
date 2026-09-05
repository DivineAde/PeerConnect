// A deliberately small structured logger. A challenge of this size does
// not warrant pulling in a full logging stack (pino/winston + transports)
// — console output in a predictable, greppable format is enough, and it
// is trivial to swap for a real logger later without touching call sites.

type Level = "info" | "warn" | "error";

function write(level: Level, message: string, meta?: Record<string, unknown>) {
  const line = {
    level,
    time: new Date().toISOString(),
    message,
    ...meta,
  };
  const serialized = JSON.stringify(line);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};
