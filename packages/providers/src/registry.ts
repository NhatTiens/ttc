import type { ProviderAdapter } from "./contracts";

export class ProviderRegistry {
  private readonly adapters = new Map<string, ProviderAdapter>();

  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.code.toUpperCase(), adapter);
  }

  get(code: string): ProviderAdapter {
    const adapter = this.adapters.get(code.toUpperCase());
    if (!adapter) throw new Error(`No provider adapter registered for ${code}.`);
    return adapter;
  }

  has(code: string): boolean {
    return this.adapters.has(code.toUpperCase());
  }

  listCodes(): string[] {
    return [...this.adapters.keys()].sort();
  }
}

import { TTCProviderAdapter } from "./adapters/ttc-provider-adapter";

export function createDefaultProviderRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();
  registry.register(new TTCProviderAdapter());
  return registry;
}
