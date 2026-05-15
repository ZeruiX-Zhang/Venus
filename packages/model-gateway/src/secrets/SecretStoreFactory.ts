import { BrowserEncryptedSecretStore } from "./BrowserEncryptedSecretStore";
import { InMemorySecretStore } from "./InMemorySecretStore";
import { TauriStrongholdSecretStore } from "./TauriStrongholdSecretStore";
import type { SecretStore } from "./SecretStore";

export type SecretStoreKind = "memory" | "browser" | "tauri";

export const createSecretStore = (kind: SecretStoreKind = "memory"): SecretStore => {
  if (kind === "browser") {
    return new BrowserEncryptedSecretStore();
  }
  if (kind === "tauri") {
    return new TauriStrongholdSecretStore();
  }
  return new InMemorySecretStore();
};

export const createBestAvailableSecretStore = (): SecretStore => {
  if (typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__)) {
    return new TauriStrongholdSecretStore();
  }
  if (typeof globalThis.localStorage !== "undefined") {
    return new BrowserEncryptedSecretStore();
  }
  return new InMemorySecretStore();
};
