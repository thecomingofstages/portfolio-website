/**
 * The one way to log. Workers send console output to `wrangler tail` and the dashboard.
 *
 * Privacy (AGENTS.md): many members are minors. Never log request bodies, people's
 * names with photos or projects, tokens, or the database URI. Pass error objects
 * as they are: only their name and message are written.
 */
type Meta = Record<string, string | number | boolean | null | undefined>;

/** Hides credentials in URLs, e.g. mongodb+srv://user:pass@host → mongodb+srv://***@host */
export function redact(text: string): string {
  return text.replace(/([a-z][a-z0-9+.-]*:\/\/)[^/@\s]+@/gi, "$1***@");
}

function write(level: "info" | "warn" | "error", message: string, meta?: Meta) {
  console[level](redact(JSON.stringify({ level, message, ...meta })));
}

export const Logger = {
  info: (message: string, meta?: Meta) => write("info", message, meta),
  warn: (message: string, meta?: Meta) => write("warn", message, meta),
  error: (message: string, err?: unknown, meta?: Meta) =>
    write("error", message, {
      ...meta,
      error_name: (err as Error | undefined)?.name,
      error_message: (err as Error | undefined)?.message,
    }),
};
