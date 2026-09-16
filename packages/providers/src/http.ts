import { classifyHttpError, ProviderAdapterError, toProviderAdapterError } from "./errors";

export async function providerFetch(
  url: URL,
  init: RequestInit,
  options: { timeoutMs: number; allowHosts: readonly string[]; ambiguousSideEffect?: boolean }
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
    if (!response.ok) throw classifyHttpError(response.status);
    return response;
  } catch (error) {
    throw toProviderAdapterError(error, options.ambiguousSideEffect ?? false);
  } finally {
    clearTimeout(timer);
  }
}
