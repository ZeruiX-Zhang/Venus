import {
  createSecretMetadata,
  type SecretStore,
  type StoredSecretMetadata
} from "./SecretStore";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const encode = (value: string): string => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(unescape(encodeURIComponent(value)));
  }
  return value;
};

const decode = (value: string): string => {
  if (typeof globalThis.atob === "function") {
    return decodeURIComponent(escape(globalThis.atob(value)));
  }
  return value;
};

export class BrowserEncryptedSecretStore implements SecretStore {
  private readonly prefix: string;
  private readonly storage: StorageLike | undefined;

  constructor(prefix = "pca:v04:secret:", storage?: StorageLike) {
    this.prefix = prefix;
    this.storage =
      storage ??
      (typeof globalThis.localStorage !== "undefined"
        ? globalThis.localStorage
        : undefined);
  }

  async getSecret(key: string): Promise<string | undefined> {
    const stored = this.storage?.getItem(this.keyFor(key));
    return stored ? decode(stored) : undefined;
  }

  async setSecret(key: string, value: string): Promise<StoredSecretMetadata> {
    if (!this.storage) {
      throw new Error("Browser storage is unavailable in this environment.");
    }
    this.storage.setItem(this.keyFor(key), encode(value));
    this.storage.setItem(
      this.metadataKeyFor(key),
      JSON.stringify(createSecretMetadata(key, value, "browser_local_dev", this.warning()))
    );
    return (await this.getMetadata(key)) ?? createSecretMetadata(key, value, "browser_local_dev", this.warning());
  }

  async deleteSecret(key: string): Promise<void> {
    this.storage?.removeItem(this.keyFor(key));
    this.storage?.removeItem(this.metadataKeyFor(key));
  }

  async getMetadata(key: string): Promise<StoredSecretMetadata | undefined> {
    const raw = this.storage?.getItem(this.metadataKeyFor(key));
    if (!raw) {
      const secret = await this.getSecret(key);
      return secret
        ? createSecretMetadata(key, secret, "browser_local_dev", this.warning())
        : undefined;
    }
    return JSON.parse(raw) as StoredSecretMetadata;
  }

  describe(): string {
    return "Browser local development secret store. It masks keys in UI, but browser storage is not equivalent to OS keychain storage.";
  }

  private keyFor(key: string): string {
    return `${this.prefix}${key}`;
  }

  private metadataKeyFor(key: string): string {
    return `${this.prefix}${key}:metadata`;
  }

  private warning(): string {
    return "Local browser storage is for development inspection only. Use Tauri Stronghold or OS keychain before production.";
  }
}
