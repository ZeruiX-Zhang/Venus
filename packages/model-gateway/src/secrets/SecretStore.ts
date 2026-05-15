export interface StoredSecretMetadata {
  key: string;
  masked: string;
  storage: string;
  warning?: string;
  updatedAt: string;
}

export interface SecretStore {
  getSecret(key: string): Promise<string | undefined>;
  setSecret(key: string, value: string): Promise<StoredSecretMetadata>;
  deleteSecret(key: string): Promise<void>;
  describe(): string;
  getMetadata?(key: string): Promise<StoredSecretMetadata | undefined>;
}

export const maskSecret = (value: string | undefined): string => {
  if (!value) {
    return "not saved";
  }
  if (value.length <= 8) {
    return `${value.slice(0, 1)}***${value.slice(-1)}`;
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

export const createSecretMetadata = (
  key: string,
  value: string,
  storage: string,
  warning?: string
): StoredSecretMetadata => ({
  key,
  masked: maskSecret(value),
  storage,
  ...(warning ? { warning } : {}),
  updatedAt: new Date().toISOString()
});
