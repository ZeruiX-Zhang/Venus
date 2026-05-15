import {
  createSecretMetadata,
  type SecretStore,
  type StoredSecretMetadata
} from "./SecretStore";

export class InMemorySecretStore implements SecretStore {
  private readonly values = new Map<string, string>();
  private readonly metadata = new Map<string, StoredSecretMetadata>();

  async getSecret(key: string): Promise<string | undefined> {
    return this.values.get(key);
  }

  async setSecret(key: string, value: string): Promise<StoredSecretMetadata> {
    this.values.set(key, value);
    const metadata = createSecretMetadata(
      key,
      value,
      "memory",
      "Secret is held in memory and disappears when the app reloads."
    );
    this.metadata.set(key, metadata);
    return metadata;
  }

  async deleteSecret(key: string): Promise<void> {
    this.values.delete(key);
    this.metadata.delete(key);
  }

  async getMetadata(key: string): Promise<StoredSecretMetadata | undefined> {
    const metadata = this.metadata.get(key);
    return metadata ? { ...metadata } : undefined;
  }

  describe(): string {
    return "In-memory secret store. Secrets disappear when the app reloads.";
  }
}
