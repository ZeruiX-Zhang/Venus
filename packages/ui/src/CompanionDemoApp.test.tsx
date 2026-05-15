import {
  MemorySkillRegistry,
  createAlwaysOnMemoryPackets
} from "@personal-character-agent/memory-runtime";
import { createDefaultAssetGenerationConfig } from "@personal-character-agent/asset-generation";
import { yuliQingyiManifest } from "@personal-character-agent/avatar-assets";
import { getDefaultAvatarManifest } from "@personal-character-agent/avatar-model";
import { createDefaultPersonalityMatrix } from "@personal-character-agent/persona-runtime";
import { createDefaultSafetyProfile } from "@personal-character-agent/safety-runtime";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CompanionDemoApp,
  DeveloperView,
  MemoryView,
  PersonaView
} from "./CompanionDemoApp";
import { AvatarStudioPanel } from "./components/AvatarStudio";

const noop = () => undefined;

describe("Companion v0.4 UI surfaces", () => {
  it("renders the inspectable app shell with chat-first stage", () => {
    const html = renderToString(<CompanionDemoApp variant="web" />);

    expect(html).toContain("玉璃清仪 v0.4");
    expect(html).toContain("玉璃清仪");
    expect(html).toContain("修正");
    expect(html).toContain('data-character-asset-id="yuli-qingyi"');
    expect(html).toContain('data-render-source="local-asset"');
    expect(html).toContain('data-character-asset-view="fullbody"');
    expect(html).not.toContain("pca-layered-avatar--stage");
  });

  it("renders the Memory Skill dashboard", () => {
    const html = renderToString(
      <MemoryView
        alwaysOnPackets={createAlwaysOnMemoryPackets({
          characterName: "玉璃清仪",
          activePersonaSummary: "base_core",
          userProfileSummary: "prefers concise answers",
          relationshipContract: "safe companion boundaries",
          safetyMode: "adult",
          currentScene: "test",
          developerMode: false
        })}
        developerMode={false}
        editingMemoryId=""
        editingMemoryText=""
        lastRecalled={[]}
        manualMemory=""
        manualSkillId="user_preference_memory"
        memoryExportJson=""
        memorySkills={new MemorySkillRegistry().list()}
        memoryWriteMode="ask"
        pendingSuggestions={[]}
        records={[]}
        onAdd={noop}
        onCancelEdit={noop}
        onChangeEditText={noop}
        onChangeManualMemory={noop}
        onChangeManualSkill={noop}
        onChangeMode={noop}
        onDelete={noop}
        onDeleteAll={noop}
        onEdit={noop}
        onExport={noop}
        onSaveEdit={noop}
        onToggleSkill={noop}
      />
    );

    expect(html).toContain("神识·灵法");
    expect(html).toContain("用户偏好记忆");
    expect(html).toContain("神识·灵法修正");
  });

  it("renders the Personality Matrix screen", () => {
    const html = renderToString(
      <PersonaView
        developerMode={false}
        matrix={createDefaultPersonalityMatrix("玉璃清仪")}
        onAddOriginalCore={noop}
        onDuplicateCore={noop}
        onToggleCore={noop}
        onUpdateCore={noop}
      />
    );

    expect(html).toContain("记忆·心识");
    expect(html).toContain("玉璃清仪 base core");
    expect(html).toContain("记忆卷宗");
  });

  it("renders developer-only diagnostics", () => {
    const html = renderToString(
      <DeveloperView
        assetGenerationConfig={createDefaultAssetGenerationConfig()}
        auditEntries={[]}
        lastDebugInfo={undefined}
        matrix={createDefaultPersonalityMatrix("玉璃清仪")}
        memorySkills={new MemorySkillRegistry().list()}
        rawMatrixJson="{}"
        rawSafetyJson="{}"
        safetyProfile={createDefaultSafetyProfile("adult")}
        traces={[]}
        onApplyRawMatrix={noop}
        onApplyRawSafety={noop}
        onChangeAssetGenerationConfig={noop}
        onChangeRawMatrixJson={noop}
        onChangeRawSafetyJson={noop}
        onOpenProvider={noop}
      />
    );

    expect(html).toContain("观道");
    expect(html).toContain("启仙缘 QA");
    expect(html).toContain("Memory Skill Registry");
  });

  it("renders the Avatar Studio page", () => {
    const html = renderToString(
      <AvatarStudioPanel
        assetConfig={createDefaultAssetGenerationConfig()}
        characterAssetManifest={yuliQingyiManifest}
        developerMode={false}
        manifest={getDefaultAvatarManifest()}
        onApplyCharacterAsset={noop}
        onChangeManifest={noop}
        onPreviewState={noop}
      />
    );

    expect(html).toContain("容相阁");
    expect(html).toContain("玉璃清仪");
    expect(html).toContain("preset-card.png");
    expect(html).toContain("turnaround-sheet.png");
    expect(html).toContain("contact-sheet.png");
    expect(html).toContain("import-report.json");
    expect(html).toContain("容相完备检");
    expect(html).toContain("容相入殿检");
    expect(html).toContain("容相注引");
  });
});
