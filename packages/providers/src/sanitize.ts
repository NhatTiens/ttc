const REDACTED = "[REDACTED]";
const sensitiveKey = /(^|[-_])(api[-_]?key|key|token|secret|authorization|password|cookie|signature|credential)([-_]|$)/i;

export function sanitizeProviderValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[TRUNCATED]";
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") return value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeProviderValue(item, depth + 1));
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 100)) {
      const normalizedKey = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2");
      Object.defineProperty(output, key, { value: sensitiveKey.test(normalizedKey) ? REDACTED : sanitizeProviderValue(item, depth + 1), enumerable: true, configurable: true, writable: true });
    }
    return output;
  }
  return String(value);
}

export function sanitizeProviderErrorMessage(message: string): string {
  return message
    .replace(/((?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|authorization|key)\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s&,;]+)/gi, "$1[REDACTED]")
    .replace(/(bearer\s+)[^\s]+/gi, "$1[REDACTED]").slice(0, 500);
}
