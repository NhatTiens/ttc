import { classifyHttpError, ProviderAdapterError, toProviderAdapterError } from "./errors";

export async function providerFetch(
  url: URL,
  init: RequestInit,
  options: { timeoutMs: number; allowHosts: readonly string[]; ambiguousSideEffect?: boolean; maxResponseBytes?: number }
): Promise<Response> {
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Provider URL must use HTTPS.");
  }
  if (!options.allowHosts.includes(url.hostname)) {
    throw new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Provider host is not allowlisted.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, options.timeoutMs));
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, redirect: "error" });
    if (!response.ok) {
      const error = classifyHttpError(response.status);
      // A gateway/server failure can occur after an upstream create committed.
      if (options.ambiguousSideEffect && response.status >= 500) {
        throw new ProviderAdapterError(error.code, error.message, {
          retryable: error.retryable, httpStatus: response.status, ambiguousSideEffect: true
        });
      }
      throw error;
    }
    // Keep the deadline active until the response body finishes, not just until
    // headers arrive. Adapters may safely parse this buffered response afterwards.
    const chunks: Uint8Array[] = [];
    let size = 0;
    const reader = response.body?.getReader();
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > (options.maxResponseBytes ?? 2_000_000)) {
          await reader.cancel().catch(() => undefined);
          throw new ProviderAdapterError("PROVIDER_MALFORMED_RESPONSE", "Provider response exceeded the maximum accepted size.", { ambiguousSideEffect: options.ambiguousSideEffect });
        }
        chunks.push(value);
      }
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return new Response(response.body ? body : null, { status: response.status, statusText: response.statusText, headers: response.headers });
  } catch (error) {
    throw toProviderAdapterError(error, options.ambiguousSideEffect ?? false);
  } finally {
    clearTimeout(timer);
  }
}
