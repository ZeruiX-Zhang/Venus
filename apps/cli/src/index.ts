import { join } from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import {
  CompanionRuntime,
  type MemoryWriteMode
} from "@personal-character-agent/agent-runtime";
import { renderPixelAvatar, type AvatarState } from "@personal-character-agent/avatar-runtime";
import { FileMemorySkillStore } from "@personal-character-agent/memory-runtime/node";
import {
  MemorySkillRegistry,
  saveMemory,
  type MemoryWriteSuggestion
} from "@personal-character-agent/memory-runtime";
import { createDefaultProviderSettings } from "@personal-character-agent/model-gateway";
import { createDefaultPersonalityMatrix } from "@personal-character-agent/persona-runtime";
import {
  createDefaultSafetyProfile,
  setSafetyMode,
  type SafetyMode
} from "@personal-character-agent/safety-runtime";
import {
  createDefaultCharacterProfile,
  createDefaultModelProviderConfig,
  createDefaultSoulCard
} from "@personal-character-agent/shared";

let developerMode = false;
let memoryWriteMode: MemoryWriteMode = "ask";
let safetyProfile = createDefaultSafetyProfile("adult", "companion");
const soulCard = createDefaultSoulCard("Mira");
const characterProfile = {
  ...createDefaultCharacterProfile("Mira"),
  soulCardId: soulCard.id
};
const matrix = createDefaultPersonalityMatrix("Mira");
const memoryStore = new FileMemorySkillStore(
  join(process.cwd(), ".pca-cli-memory-skills.json")
);
const memoryRegistry = new MemorySkillRegistry();
const providerSettings = createDefaultProviderSettings();

const createRuntime = () =>
  new CompanionRuntime({
    config: {
      mode: "mock",
      developerMode,
      strictMode: safetyProfile.mode === "strict",
      memoryWriteMode,
      modelProvider: {
        ...createDefaultModelProviderConfig(),
        mockMode: true
      },
      modelGatewaySettings: providerSettings,
      safetyProfile,
      personalityMatrix: matrix,
      enabledMemorySkillIds: memoryRegistry.enabledIds()
    },
    soulCard,
    characterProfile,
    memorySkillStore: memoryStore,
    memoryRegistry,
    safetyProfile,
    personalityMatrix: matrix
  });

let runtime = createRuntime();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

let inputClosed = false;
rl.on("close", () => {
  inputClosed = true;
});

const printAvatar = (state: AvatarState, caption = "") => {
  console.log(renderPixelAvatar(state, caption));
};

const approveSuggestions = async (suggestions: MemoryWriteSuggestion[]) => {
  for (const suggestion of suggestions) {
    const answer = (
      await rl.question(`Save memory "${suggestion.candidate.content}"? (y/N) `)
    )
      .trim()
      .toLowerCase();
    if (answer === "y" || answer === "yes") {
      await saveMemory(suggestion, memoryStore);
      printAvatar("happy", "memory saved");
    } else {
      console.log("Memory skipped.");
    }
  }
};

const showHelp = () => {
  console.log(
    [
      "Commands:",
      "/memory                 list Memory Skill records",
      "/persona                show active persona cores",
      "/minor on               enable minor-safe mode",
      "/minor off              return to adult mode",
      "/dev                    toggle developer traces",
      "/export                 print memory export JSON",
      "/help                   show commands",
      "/exit                   close the companion"
    ].join("\n")
  );
};

printAvatar("idle", "Mira is ready in mock mode");
showHelp();

while (true) {
  const line = await askInput();
  if (line === undefined) {
    break;
  }
  const input = line.trim();

  if (input === "/exit") {
    break;
  }

  if (input === "/help") {
    showHelp();
    continue;
  }

  if (input === "/memory") {
    const records = await memoryStore.listRecords();
    if (records.length === 0) {
      console.log("No approved Memory Skill records.");
    } else {
      for (const record of records) {
        console.log(`- ${record.id} [${record.skillId}] ${record.content}`);
      }
    }
    continue;
  }

  if (input === "/persona") {
    console.log(`Character: ${matrix.characterName}`);
    for (const core of matrix.cores.filter((item) => matrix.activeCoreIds.includes(item.id))) {
      console.log(`- ${core.id}: ${core.name} (${core.origin})`);
    }
    continue;
  }

  if (input === "/minor on" || input === "/minor off") {
    const mode: SafetyMode = input.endsWith("on") ? "minor" : "adult";
    safetyProfile = setSafetyMode(safetyProfile, mode);
    runtime = createRuntime();
    printAvatar(mode === "minor" ? "peeking" : "idle", `${mode} mode`);
    continue;
  }

  if (input === "/dev") {
    developerMode = !developerMode;
    runtime = createRuntime();
    console.log(`Developer mode ${developerMode ? "on" : "off"}.`);
    continue;
  }

  if (input === "/export") {
    console.log(JSON.stringify(await memoryStore.exportRecords(), null, 2));
    continue;
  }

  if (input === "/memory ask") {
    memoryWriteMode = "ask";
    runtime = createRuntime();
    console.log("Memory write mode: ask before saving.");
    continue;
  }

  printAvatar("thinking", "thinking");
  const result = await runtime.sendMessage(input);
  printAvatar(result.safetyResult?.blocked ? "confused" : "speaking", "speaking");
  console.log(result.text);
  if (developerMode) {
    console.log(
      JSON.stringify(
        {
          traceId: result.traceId,
          activePersonaCores: result.activePersonaCores?.map((core) => core.id),
          recalledMemoryPackets: result.recalledMemoryPackets?.map((packet) => ({
            namespace: packet.namespace,
            reason: packet.reason
          })),
          safety: result.safetyResult,
          evaluator: result.evaluatorResult
        },
        null,
        2
      )
    );
  }
  await approveSuggestions(result.memoryWriteSuggestions ?? []);
  printAvatar("idle", "ready");
}

rl.close();
printAvatar("sleepy", "session closed");

async function askInput(): Promise<string | undefined> {
  if (inputClosed) {
    return undefined;
  }
  return Promise.race([
    rl.question("> "),
    new Promise<undefined>((resolve) => {
      rl.once("close", () => resolve(undefined));
    })
  ]);
}
