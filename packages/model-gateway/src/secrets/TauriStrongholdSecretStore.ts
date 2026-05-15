import { InMemorySecretStore } from "./InMemorySecretStore";
import type { StoredSecretMetadata } from "./SecretStore";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export class TauriStrongholdSecretStore extends InMemorySecretStore {
  private readonly tauriMetadata = new Map<string, StoredSecretMetadata>();

  isAvailable(): boolean {
    return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
  }

  override async setSecret(
    key: string,
    value: string
  ): Promise<StoredSecretMetadata> {
    const metadata = await super.setSecret(key, value);
    const updated = {
      ...metadata,
      storage: this.isAvailable() ? "tauri_stronghold_pending" : "memory_fallback",
      warning: this.isAvailable()
        ? "Tauri is available, but the Stronghold plugin is not bundled in this prototype. Wire this adapter to tauri-plugin-stronghold before production."
        : "Tauri runtime is unavailable; using memory fallback."
    };
    this.tauriMetadata.set(key, updated);
    return updated;
  }

  override async deleteSecret(key: string): Promise<void> {
    await super.deleteSecret(key);
    this.tauriMetadata.delete(key);
  }

  override async getMetadata(key: string): Promise<StoredSecretMetadata | undefined> {
    const metadata = this.tauriMetadata.get(key);
    return metadata ? { ...metadata } : super.getMetadata(key);
  }

  override describe(): string {
    return "Tauri Stronghold adapter surface. The plugin is not bundled, so this prototype falls back to memory and documents the integration point.";
  }
}
