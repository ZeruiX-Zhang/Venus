import {
  MockModelClient,
  OpenAICompatibleModelClient,
  type ModelClient
} from "@personal-character-agent/agent-core";
import { AvatarEventBus } from "@personal-character-agent/avatar-core/events";
import {
  BrowserLocalStorageMemoryAdapter,
  LocalJsonMemoryStore
} from "@personal-character-agent/memory-core";
import {
  createDefaultCharacterProfile,
  createDefaultModelProviderConfig,
  createDefaultSoulCard,
  type CharacterProfile,
  type ModelProviderConfig,
  type SoulCard
} from "@personal-character-agent/shared";
import { LocalKeywordRetriever } from "./knowledge/retrieval";
import { InMemoryAuditLog } from "./security/auditLog";
import { PermissionPolicy } from "./security/permissions";
import { InMemorySecretStore } from "./secrets/secretStore";
import type { RuntimeConfig, RuntimeMode } from "./types";

export interface CompanionRuntimeFactoryInput {
  mode?: RuntimeMode;
  developerMode?: boolean;
  strictMode?: boolean;
  soulCard?: SoulCard;
  characterProfile?: CharacterProfile;
  modelProvider?: ModelProviderConfig;
}

export const createRuntimeModelClient = (
  mode: RuntimeMode,
  modelProvider: ModelProviderConfig
): ModelClient => {
  if (mode === "mock" || modelProvider.mockMode) {
    return new MockModelClient();
  }
  return OpenAICompatibleModelClient.fromConfig(modelProvider);
};

export const createDefaultRuntimeConfig = (
  input: CompanionRuntimeFactoryInput = {}
): {
  config: RuntimeConfig;
  soulCard: SoulCard;
  characterProfile: CharacterProfile;
  memoryStore: LocalJsonMemoryStore;
  avatarEventBus: AvatarEventBus;
} => {
  const soulCard = input.soulCard ?? createDefaultSoulCard("Mira");
  const characterProfile =
    input.characterProfile ??
    ({
      ...createDefaultCharacterProfile(soulCard.character_name),
      soulCardId: soulCard.id
    } satisfies CharacterProfile);
  const mode = input.mode ?? "mock";
  const modelProvider = input.modelProvider ?? createDefaultModelProviderConfig();

  const config: RuntimeConfig = {
    mode,
    developerMode: input.developerMode ?? false,
    strictMode: input.strictMode ?? false,
    memoryWriteMode: "ask",
    modelProvider,
    modelClient: createRuntimeModelClient(mode, modelProvider),
    permissionPolicy: new PermissionPolicy(),
    auditLog: new InMemoryAuditLog(),
    retriever: new LocalKeywordRetriever(soulCard.knowledge),
    secretStore: new InMemorySecretStore()
  };

  return {
    config,
    soulCard,
    characterProfile,
    memoryStore: new LocalJsonMemoryStore(
      new BrowserLocalStorageMemoryAdapter("pca:runtime:memories")
    ),
    avatarEventBus: new AvatarEventBus()
  };
};
