export interface SecretStore {
  getSecret(key: string): Promise<string | undefined>;
  setSecret(key: string, value: string): Promise<void>;
  deleteSecret(key: string): Promise<void>;
}

export class InMemorySecretStore implements SecretStore {
  private readonly secrets = new Map<string, string>();

  async getSecret(key: string): Promise<string | undefined> {
    return this.secrets.get(key);
  }

  async setSecret(key: string, value: string): Promise<void> {
    this.secrets.set(key, value);
  }

  async deleteSecret(key: string): Promise<void> {
    this.secrets.delete(key);
  }
}

export class LocalSecretStore implements SecretStore {
  async getSecret(_key: string): Promise<string | undefined> {
    return undefined;
  }

  async setSecret(_key: string, _value: string): Promise<void> {
    throw new Error(
      "LocalSecretStore is a placeholder. Use OS keychain or Tauri secure storage before persisting API keys."
    );
  }

  async deleteSecret(_key: string): Promise<void> {
    return;
  }
}
