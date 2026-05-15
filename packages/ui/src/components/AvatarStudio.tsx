import {
  createAssetGenerationProvider,
  type AssetGenerationConfig,
  type AssetGenerationJob,
  type AssetGenerationProviderId,
  type AssetProviderTestResult
} from "@personal-character-agent/asset-generation";
import {
  characterPortraitIds,
  createImageFallbackCandidates,
  getYuliQingyiCompletenessItems,
  publicPathForCharacterAsset,
  resolveCharacterAssetPath,
  yuliQingyiImportSlots,
  yuliQingyiManifest,
  type CharacterAssetCompletenessItem,
  type CharacterAssetManifest,
  type CharacterAssetView,
  type CharacterPortraitId
} from "@personal-character-agent/avatar-assets";
import { CharacterAssetRenderer } from "@personal-character-agent/avatar-assets/react";
import {
  avatarMaterialKinds,
  avatarPartDisplayNames,
  avatarPresetLibrary,
  cloneAvatarManifest,
  exportAvatarManifest,
  getDefaultAvatarManifest,
  importAvatarManifest,
  updateBodyShape,
  updateFaceShape,
  updateMaterialSlot,
  updateOutfit,
  type AccessorySchema,
  type AvatarManifest,
  type AvatarPartId,
  type BodyShape,
  type FaceShape,
  type HairSchema,
  type MaterialSlot,
  type OutfitSchema
} from "@personal-character-agent/avatar-model";
import { visibleMaterialPartIds } from "@personal-character-agent/avatar-model";
import type { AvatarState } from "@personal-character-agent/avatar-runtime";
import {
  createDefaultPixelPortrait,
  pixelizeImage,
  type PixelPortrait
} from "@personal-character-agent/avatar-runtime";
import {
  Layered2DAvatar,
  PixelPortraitStage
} from "@personal-character-agent/avatar-runtime/react";
import {
  Box,
  Check,
  Clipboard,
  Download,
  Image,
  RefreshCcw,
  Save,
  Shuffle,
  Upload,
  Wand2
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { EmptyState } from "./EmptyState";
import { InspectorPanel } from "./InspectorPanel";
import { StatusPill } from "./StatusPill";

type AvatarStudioTab =
  | "presets"
  | "face"
  | "features"
  | "hair"
  | "body"
  | "outfit"
  | "materials"
  | "accessories"
  | "motions"
  | "pixel"
  | "ai";

const studioTabs: Array<{ id: AvatarStudioTab; label: string }> = [
  { id: "presets", label: "预设" },
  { id: "face", label: "脸型" },
  { id: "features", label: "五官" },
  { id: "hair", label: "发型" },
  { id: "body", label: "身材" },
  { id: "outfit", label: "服装" },
  { id: "materials", label: "材质颜色" },
  { id: "accessories", label: "配饰" },
  { id: "motions", label: "动作表情" },
  { id: "pixel", label: "像素方块" },
  { id: "ai", label: "AI 生成" }
];

const materialPartOrder = [
  "skin",
  "hair",
  "eyes",
  "innerRobe",
  "outerRobe",
  "sleeves",
  "pibo",
  "belt",
  "skirt",
  "shoes",
  "hairpin",
  "earrings",
  "embroidery",
  "backgroundGlow"
] as const satisfies readonly AvatarPartId[];

interface AvatarStudioPanelProps {
  characterAssetManifest: CharacterAssetManifest;
  manifest: AvatarManifest;
  assetConfig: AssetGenerationConfig;
  developerMode: boolean;
  displayStyle?: "asset" | "pixel";
  pixelPortrait?: PixelPortrait;
  onApplyCharacterAsset: (manifest: CharacterAssetManifest) => void;
  onChangeManifest: (manifest: AvatarManifest) => void;
  onChangeDisplayStyle?: (style: "asset" | "pixel") => void;
  onChangePixelPortrait?: (portrait: PixelPortrait) => void;
  onPreviewState: (state: AvatarState) => void;
}

const timestamp = (): string => new Date().toISOString();

const withUpdateTime = (manifest: AvatarManifest): AvatarManifest => ({
  ...manifest,
  updatedAt: timestamp()
});

const randomFrom = <T extends string>(items: readonly T[]): T => {
  const index = Math.floor(Math.random() * items.length);
  const item = items[index];
  if (!item) {
    throw new Error("Cannot pick from an empty list.");
  }
  return item;
};

export function AvatarStudioPanel({
  characterAssetManifest,
  manifest,
  assetConfig,
  developerMode,
  displayStyle = "asset",
  pixelPortrait,
  onApplyCharacterAsset,
  onChangeManifest,
  onChangeDisplayStyle,
  onChangePixelPortrait,
  onPreviewState
}: AvatarStudioPanelProps) {
  const [activeTab, setActiveTab] = useState<AvatarStudioTab>("presets");
  const [assetPreviewView, setAssetPreviewView] = useState<CharacterAssetView>("fullbody");
  const [assetPreviewPortrait, setAssetPreviewPortrait] = useState<CharacterPortraitId>("neutral");
  const [selectedMaterialPart, setSelectedMaterialPart] = useState<AvatarPartId>("outerRobe");
  const [customPresets, setCustomPresets] = useState<AvatarManifest[]>([]);
  const [manifestJson, setManifestJson] = useState("");
  const [status, setStatus] = useState("角色工坊已加载");
  const [compareDefault, setCompareDefault] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("玉白与浅青绿的古风陪伴角色，半透明披帛，温和脸型，玉簪耳饰，汉服层次清晰。");
  const [referenceName, setReferenceName] = useState("");
  const [generationJob, setGenerationJob] = useState<AssetGenerationJob>();
  const [assetStatuses, setAssetStatuses] = useState<Record<string, "loaded" | "missing">>({});

  const provider = useMemo(
    () =>
      createAssetGenerationProvider(
        assetConfig.provider === "mock" || !assetConfig.apiKey
          ? { ...assetConfig, provider: "mock" }
          : assetConfig
      ),
    [assetConfig]
  );

  const allPresets = [...avatarPresetLibrary, ...customPresets];
  const completenessItems = useMemo(() => getYuliQingyiCompletenessItems(), []);

  const recordAssetStatus = (key: string, nextStatus: "loaded" | "missing"): void => {
    setAssetStatuses((current) =>
      current[key] === nextStatus ? current : { ...current, [key]: nextStatus }
    );
  };

  const applyManifest = (next: AvatarManifest, message: string): void => {
    onChangeManifest(withUpdateTime(next));
    setStatus(message);
  };

  const updateHair = (patch: Partial<HairSchema>): void => {
    onChangeManifest(withUpdateTime({ ...manifest, hair: { ...manifest.hair, ...patch } }));
  };

  const updateAccessory = (patch: Partial<AccessorySchema>): void => {
    onChangeManifest(withUpdateTime({ ...manifest, accessories: { ...manifest.accessories, ...patch } }));
  };

  const updateMaterial = (partId: AvatarPartId, patch: Partial<MaterialSlot>): void => {
    onChangeManifest(updateMaterialSlot(manifest, partId, patch));
    setSelectedMaterialPart(partId);
  };

  const updateBody = (patch: Partial<BodyShape>): void => {
    onChangeManifest(updateBodyShape(manifest, patch));
  };

  const updateFace = (patch: Partial<FaceShape>): void => {
    const next = updateFaceShape(manifest, patch);
    const eyeColor = patch.eyeColor;
    onChangeManifest(eyeColor ? updateMaterialSlot(next, "eyes", { color: eyeColor }) : next);
  };

  const updateOutfitSchema = (patch: Partial<OutfitSchema>): void => {
    onChangeManifest(updateOutfit(manifest, patch));
  };

  const saveAsPreset = (): void => {
    const preset: AvatarManifest = {
      ...cloneAvatarManifest(manifest),
      id: `custom_${Date.now()}`,
      name: `${manifest.name} · 自定义`,
      description: "从 Avatar Studio 保存的新预设。",
      tags: [...manifest.tags, "custom"],
      updatedAt: timestamp()
    };
    setCustomPresets((current) => [preset, ...current]);
    applyManifest(preset, "已保存为新预设");
  };

  const duplicatePreset = (): void => {
    const preset: AvatarManifest = {
      ...cloneAvatarManifest(manifest),
      id: `copy_${Date.now()}`,
      name: `${manifest.name} · 副本`,
      description: `${manifest.description}（副本）`,
      tags: [...manifest.tags, "copy"],
      updatedAt: timestamp()
    };
    setCustomPresets((current) => [preset, ...current]);
    applyManifest(preset, "已复制当前预设");
  };

  const exportJson = (): void => {
    setManifestJson(exportAvatarManifest(manifest));
    setStatus("AvatarManifest JSON 已导出到预览框");
  };

  const importJson = (): void => {
    try {
      const imported = importAvatarManifest(manifestJson);
      applyManifest(imported, "已导入 AvatarManifest JSON");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "导入失败");
    }
  };

  const resetCurrentPart = (): void => {
    const base = getDefaultAvatarManifest();
    if (activeTab === "materials") {
      updateMaterial(selectedMaterialPart, base.materials[selectedMaterialPart]);
      setStatus(`已重置${avatarPartDisplayNames[selectedMaterialPart]}材质`);
      return;
    }
    if (activeTab === "face" || activeTab === "features") {
      applyManifest({ ...manifest, face: base.face, materials: { ...manifest.materials, eyes: base.materials.eyes, skin: base.materials.skin } }, "已重置脸型与五官");
      return;
    }
    if (activeTab === "hair") {
      applyManifest({ ...manifest, hair: base.hair, materials: { ...manifest.materials, hair: base.materials.hair, hairpin: base.materials.hairpin } }, "已重置发型");
      return;
    }
    if (activeTab === "body") {
      applyManifest({ ...manifest, body: base.body }, "已重置身材");
      return;
    }
    if (activeTab === "outfit") {
      applyManifest({
        ...manifest,
        outfit: base.outfit,
        materials: {
          ...manifest.materials,
          innerRobe: base.materials.innerRobe,
          outerRobe: base.materials.outerRobe,
          sleeves: base.materials.sleeves,
          pibo: base.materials.pibo,
          belt: base.materials.belt,
          skirt: base.materials.skirt,
          shoes: base.materials.shoes,
          embroidery: base.materials.embroidery
        }
      }, "已重置服装");
      return;
    }
    if (activeTab === "accessories") {
      applyManifest({
        ...manifest,
        accessories: base.accessories,
        materials: {
          ...manifest.materials,
          hairpin: base.materials.hairpin,
          earrings: base.materials.earrings,
          tassel: base.materials.tassel,
          jadePendant: base.materials.jadePendant,
          ornaments: base.materials.ornaments
        }
      }, "已重置配饰");
      return;
    }
    applyManifest(base, "已重置为玉璃默认模型");
  };

  const randomizeSimilar = (): void => {
    const next = cloneAvatarManifest(manifest);
    next.face.eyeShape = randomFrom(["almond", "phoenix", "round", "cool"] as const);
    next.face.blush = Math.max(8, Math.min(72, next.face.blush + Math.round(Math.random() * 24 - 12)));
    next.hair.bun = randomFrom(["half_up", "high_bun", "low_bun", "double_bun"] as const);
    next.hair.frontHair = randomFrom(["soft_bangs", "side_part", "curtain_bangs", "straight_bangs"] as const);
    next.outfit.sleeves = randomFrom(["wide_cloud", "layered", "ceremonial_drop", "narrow_scholar"] as const);
    next.outfit.pibo = randomFrom(["translucent_arc", "double_stream", "short_cloud"] as const);
    next.outfit.embroidery = Math.max(20, Math.min(92, next.outfit.embroidery + Math.round(Math.random() * 22 - 10)));
    next.name = `${manifest.name} · 相近随机`;
    next.id = `random_${Date.now()}`;
    applyManifest(next, "已随机生成相近风格");
  };

  const runGeneration = async (kind: "concept" | "turnaround" | "texture" | "3d"): Promise<void> => {
    const input = {
      prompt: aiPrompt,
      manifest,
      style: "guofeng" as const,
      count: kind === "turnaround" ? 4 : 1
    };
    const generationInput = referenceName ? { ...input, referenceImageName: referenceName } : input;
    const started =
      kind === "concept"
        ? await provider.generateConceptImage(generationInput)
        : kind === "turnaround"
          ? await provider.generateTurnaroundSheet(generationInput)
          : kind === "texture"
            ? await provider.generateTextureVariation(generationInput)
            : await provider.generateTextTo3D(generationInput);
    setGenerationJob(started);
    const completed = await provider.getJobStatus(started.id);
    setGenerationJob(completed);
    setStatus(completed.message);
  };

  const importGeneratedPreset = async (): Promise<void> => {
    const asset = generationJob?.assets[0];
    if (!asset) {
      setStatus("没有可导入的生成结果");
      return;
    }
    const imported = await provider.importGeneratedAsset(asset);
    setCustomPresets((current) => [imported, ...current]);
    applyManifest(imported, "生成结果已导入为角色预设");
  };

  return (
    <div className="pca-view pca-avatar-studio pca-character-workshop">
      <header className="pca-view__header">
        <Wand2 size={20} />
        <div>
          <h1>容相阁</h1>
          <p>专司容相图册、道侣 manifest、神情、姿态与视相切换之事。本相道侣先取近卷图相，程化道侣仅作末路替方。</p>
        </div>
      </header>

      <section className="pca-character-workshop__hero">
        <button
          className={[
            "pca-character-preset-card",
            characterAssetManifest.id === yuliQingyiManifest.id ? "is-active" : ""
          ].filter(Boolean).join(" ")}
          onClick={() => {
            onApplyCharacterAsset(yuliQingyiManifest);
            setStatus("已应用默认角色资产包：玉璃清仪");
          }}
          type="button"
        >
          <AssetSlotPreview
            className="pca-character-preset-card__image"
            manifest={yuliQingyiManifest}
            onStatus={(nextStatus) => recordAssetStatus("assets.thumbnails.presetCard", nextStatus)}
            path={yuliQingyiManifest.assets.thumbnails?.presetCard}
            title="preset-card.png"
          />
          <span>
            <strong>玉璃清仪</strong>
            <small>中国古风桌面陪伴角色</small>
          </span>
          <div className="pca-tags">
            {yuliQingyiManifest.styleTags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </button>

        <InspectorPanel title="当前资产包">
          <div className="pca-character-workshop__summary">
            <strong>{characterAssetManifest.displayName}</strong>
            <p>{characterAssetManifest.description}</p>
            <div className="pca-tags">
              {characterAssetManifest.styleTags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <StatusPill tone="info">{status}</StatusPill>
          </div>
        </InspectorPanel>
      </section>

      <section className="pca-character-workshop__preview" aria-label="角色资产预览">
        <div className="pca-character-workshop__main-preview">
          <CharacterAssetRenderer
            manifest={characterAssetManifest}
            portrait={assetPreviewPortrait}
            proceduralFallbackManifest={manifest}
            size="studio"
            state="idle"
            view={assetPreviewView}
          />
        </div>

        <div className="pca-character-workshop__controls">
          <div className="pca-avatar-studio__tabs" role="tablist" aria-label="资产视图切换">
            {([
              ["fullbody", "全身"],
              ["halfbody", "半身"],
              ["bust", "胸像"],
              ["avatar", "头像"],
              ["portrait", "表情"]
            ] as const).map(([view, label]) => (
              <button
                aria-selected={assetPreviewView === view}
                className={assetPreviewView === view ? "is-active" : ""}
                key={view}
                onClick={() => setAssetPreviewView(view)}
                role="tab"
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          {assetPreviewView === "portrait" && (
            <div className="pca-character-workshop__portrait-switch">
              {characterPortraitIds.map((portrait) => (
                <button
                  className={assetPreviewPortrait === portrait ? "is-active" : ""}
                  key={portrait}
                  onClick={() => setAssetPreviewPortrait(portrait)}
                  type="button"
                >
                  {portrait}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pca-character-gallery" aria-label="资产图集">
        <InspectorPanel title="主展示图">
          <div className="pca-character-gallery__trio">
            <AssetSlotPreview
              manifest={characterAssetManifest}
              onStatus={(nextStatus) => recordAssetStatus("assets.stage.fullbodyFront", nextStatus)}
              path={characterAssetManifest.assets.stage.fullbodyFront}
              title="fullbody-front.png"
            />
            <AssetSlotPreview
              manifest={characterAssetManifest}
              onStatus={(nextStatus) => recordAssetStatus("assets.stage.halfbody", nextStatus)}
              path={characterAssetManifest.assets.stage.halfbody}
              title="halfbody.png"
            />
            <AssetSlotPreview
              manifest={characterAssetManifest}
              onStatus={(nextStatus) => recordAssetStatus("assets.portraits.avatar", nextStatus)}
              path={characterAssetManifest.assets.portraits?.avatar}
              title="avatar.png"
            />
            <AssetSlotPreview
              manifest={characterAssetManifest}
              onStatus={(nextStatus) => recordAssetStatus("assets.reference.turnaroundSheet", nextStatus)}
              path={characterAssetManifest.assets.reference?.turnaroundSheet}
              title="turnaround-sheet.png"
            />
          </div>
        </InspectorPanel>

        <InspectorPanel title="四视图设定图">
          <div className="pca-character-gallery__grid">
            <AssetSlotPreview manifest={characterAssetManifest} onStatus={(nextStatus) => recordAssetStatus("assets.reference.turnaroundSheet", nextStatus)} path={characterAssetManifest.assets.reference?.turnaroundSheet} title="turnaround-sheet.png" />
            <AssetSlotPreview manifest={characterAssetManifest} onStatus={(nextStatus) => recordAssetStatus("assets.reference.materialDetails", nextStatus)} path={characterAssetManifest.assets.reference?.materialDetails} title="material-details.png" />
            <AssetSlotPreview manifest={characterAssetManifest} onStatus={(nextStatus) => recordAssetStatus("assets.reference.actionStates", nextStatus)} path={characterAssetManifest.assets.reference?.actionStates} title="action-states.png" />
            <AssetSlotPreview manifest={characterAssetManifest} onStatus={(nextStatus) => recordAssetStatus("assets.portraits.expressionSheet", nextStatus)} path={characterAssetManifest.assets.portraits?.expressionSheet} title="expression-sheet.png" />
            <AssetSlotPreview manifest={characterAssetManifest} onStatus={(nextStatus) => recordAssetStatus("assets.generated.contactSheet", nextStatus)} path={characterAssetManifest.assets.generated?.contactSheet} title="contact-sheet.png" />
          </div>
        </InspectorPanel>

        <InspectorPanel title="表情图集">
          <div className="pca-character-gallery__grid">
            {characterPortraitIds.map((portrait) => (
              <AssetSlotPreview
                key={portrait}
                manifest={characterAssetManifest}
                onStatus={(nextStatus) => recordAssetStatus(`assets.portraits.${portrait}`, nextStatus)}
                path={characterAssetManifest.assets.portraits?.[portrait]}
                title={`${portrait}.png`}
              />
            ))}
          </div>
        </InspectorPanel>
      </section>

      <AssetCompletenessPanel
        items={completenessItems}
        statuses={assetStatuses}
      />

      <PixelPossessionSection
        displayStyle={displayStyle}
        onChangeDisplayStyle={onChangeDisplayStyle}
        onChangePixelPortrait={onChangePixelPortrait}
        portrait={pixelPortrait}
      />

      <AssetImportInspectionPanel manifest={characterAssetManifest} />

      <InspectorPanel title="容相注引">
        <p className="pca-muted-copy">把外部生成的 PNG/WebP/JPG 放进 `_asset_intake/yuli-qingyi-raw`，运行 `pnpm assets:import:yuli`。导入器会自动复制原图、规范命名、生成 manifest、contact-sheet 和 import-report。</p>
        <div className="pca-character-import-table">
          {yuliQingyiImportSlots.map((slot) => (
            <article key={slot.key}>
              <strong>{slot.label}</strong>
              <code>{slot.path}</code>
              <span>{slot.recommendedSize}</span>
              <small>{slot.purpose}</small>
            </article>
          ))}
        </div>
      </InspectorPanel>

      {developerMode ? (
        <InspectorPanel title="CharacterAssetManifest JSON">
          <pre>{JSON.stringify(characterAssetManifest, null, 2)}</pre>
        </InspectorPanel>
      ) : (
        <InspectorPanel title="Manifest 预览">
          <p>普通模式隐藏复杂 JSON。开启开发者模式后可查看完整 CharacterAssetManifest、路径和未来 VRM/Live2D 入口。</p>
        </InspectorPanel>
      )}
    </div>
  );
}

function AssetSlotPreview({
  manifest,
  path,
  title,
  className,
  onStatus
}: {
  manifest: CharacterAssetManifest;
  path?: string | undefined;
  title: string;
  className?: string | undefined;
  onStatus?: ((status: "loaded" | "missing") => void) | undefined;
}) {
  const resolvedPath = path ? resolveCharacterAssetPath(manifest, path) : "";
  const candidates = useMemo(
    () => (resolvedPath ? createImageFallbackCandidates(resolvedPath) : []),
    [resolvedPath]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(candidates.length === 0);

  useEffect(() => {
    setCandidateIndex(0);
    setFailed(candidates.length === 0);
    if (candidates.length === 0) {
      onStatus?.("missing");
    }
  }, [candidates.length, resolvedPath]);

  const candidate = candidates[candidateIndex];

  if (!candidate || failed) {
    const expectedPath = resolvedPath ? publicPathForCharacterAsset(resolvedPath) : `public/assets/characters/${manifest.id}/${title}`;
    return (
      <div
        className={["pca-asset-slot", "pca-asset-slot--missing", className].filter(Boolean).join(" ")}
        data-render-source="pending-local-asset"
        role="status"
      >
        <strong>{title}</strong>
        <span>等待资产导入</span>
        <code>{expectedPath}</code>
      </div>
    );
  }

  return (
    <figure
      className={["pca-asset-slot", className].filter(Boolean).join(" ")}
      data-asset-path={candidate}
      data-render-source="local-asset"
    >
      <img
        alt={title}
        draggable={false}
        onError={() => {
          const nextIndex = candidateIndex + 1;
          if (nextIndex < candidates.length) {
            setCandidateIndex(nextIndex);
            return;
          }
          setFailed(true);
          onStatus?.("missing");
        }}
        onLoad={() => onStatus?.("loaded")}
        src={candidate}
      />
      <figcaption>{title}</figcaption>
    </figure>
  );
}

function AssetCompletenessPanel({
  items,
  statuses
}: {
  items: CharacterAssetCompletenessItem[];
  statuses: Record<string, "loaded" | "missing">;
}) {
  const loadedItems = items.filter((item) => statuses[item.key] === "loaded");
  const missingItems = items.filter((item) => statuses[item.key] === "missing");
  const pendingItems = items.filter((item) => statuses[item.key] === undefined);
  const requiredMissing = items.some(
    (item) => item.required && statuses[item.key] === "missing"
  );
  const defaultReady = !requiredMissing && statuses["assets.stage.fullbodyFront"] === "loaded";

  return (
    <InspectorPanel title="容相完备检">
      <div className="pca-character-completeness">
        <div className="pca-kpi-row">
          <StatusPill tone={defaultReady ? "good" : "warn"}>
            {defaultReady ? "可作为默认角色" : "等待默认舞台图"}
          </StatusPill>
          <StatusPill tone="info">
            已找到 {loadedItems.length} / {items.length} 张
          </StatusPill>
          {pendingItems.length > 0 && <StatusPill tone="info">检测中 {pendingItems.length}</StatusPill>}
        </div>
        <p className="pca-muted-copy">
          默认角色至少需要 fullbody-front。半身、头像、预设卡、四视图和表情会增强聊天、小窗和工坊体验。
        </p>
        <div className="pca-character-completeness__list">
          {items.map((item) => {
            const status = statuses[item.key] ?? "pending";
            return (
              <article className={`is-${status}`} key={item.key}>
                <strong>{item.label}</strong>
                <span>{status === "loaded" ? "已找到" : status === "missing" ? "缺失" : "等待检测"}</span>
                <code>{item.expectedPublicPath}</code>
              </article>
            );
          })}
        </div>
        {missingItems.length > 0 && (
          <p className="pca-muted-copy">
            缺少推荐图片：{missingItems.map((item) => item.label).join("、")}。
          </p>
        )}
      </div>
    </InspectorPanel>
  );
}

interface AssetImportInspectionReport {
  sourceDir: string;
  generatedAt: string;
  scannedCount: number;
  mappings: Record<string, {
    slot: string;
    manifestKey: string;
    publicPath: string;
    sourceFile?: string | undefined;
    confidence: number;
    reason: string;
    fallbackFrom?: string | undefined;
    generated?: boolean | undefined;
    alternates?: Array<{ fileName: string; score: number }> | undefined;
  }>;
  missingAssets: string[];
  unusedSources: string[];
  recommendations: string[];
  assetMapOverride?: {
    path: string;
    used: boolean;
    warnings: string[];
  } | undefined;
}

function AssetImportInspectionPanel({
  manifest
}: {
  manifest: CharacterAssetManifest;
}) {
  const reportPath =
    manifest.assets.generated?.importReport ??
    `/assets/characters/${manifest.id}/generated/import-report.json`;
  const contactSheetPath =
    manifest.assets.generated?.contactSheet ??
    `/assets/characters/${manifest.id}/generated/contact-sheet.png`;
  const [report, setReport] = useState<AssetImportInspectionReport>();
  const [loadState, setLoadState] = useState<"idle" | "loaded" | "missing" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    if (typeof fetch !== "function") {
      setLoadState("missing");
      return () => {
        cancelled = true;
      };
    }

    setLoadState("idle");
    fetch(reportPath, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json() as Promise<AssetImportInspectionReport>;
      })
      .then((nextReport) => {
        if (!cancelled) {
          setReport(nextReport);
          setLoadState("loaded");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadState("missing");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reportPath]);

  const mappings = Object.values(report?.mappings ?? {});
  const missingAssets = report?.missingAssets ?? manifest.importInfo?.missingAssets ?? [];
  const recommendations = report?.recommendations ?? [];
  const sourceDir = report?.sourceDir ?? manifest.importInfo?.sourceDir ?? "_asset_intake/yuli-qingyi-raw";

  return (
    <InspectorPanel title="容相入殿检">
      <div className="pca-asset-import-inspection">
        <div className="pca-kpi-row">
          <StatusPill tone={loadState === "loaded" ? "good" : "warn"}>
            {loadState === "loaded" ? "import-report 已加载" : "等待 import-report"}
          </StatusPill>
          <StatusPill tone="info">扫描图片 {report?.scannedCount ?? 0}</StatusPill>
          <StatusPill tone={missingAssets.length > 0 ? "warn" : "good"}>
            缺失 {missingAssets.length}
          </StatusPill>
        </div>

        <div className="pca-asset-import-inspection__paths">
          <span>源文件夹</span>
          <code>{sourceDir}</code>
          <span>重新导入</span>
          <code>pnpm assets:import:yuli</code>
          <span>import-report</span>
          <code>{publicPathForCharacterAsset(reportPath)}</code>
        </div>

        <AssetSlotPreview
          className="pca-asset-import-inspection__contact"
          manifest={manifest}
          path={contactSheetPath}
          title="contact-sheet.png"
        />

        <div className="pca-asset-mapping-table" role="table" aria-label="自动映射结果">
          <div role="row">
            <strong role="columnheader">资产位</strong>
            <strong role="columnheader">原图</strong>
            <strong role="columnheader">confidence</strong>
            <strong role="columnheader">输出</strong>
          </div>
          {mappings.length > 0 ? mappings.map((item) => (
            <div key={item.slot} role="row">
              <span role="cell">{item.slot}</span>
              <span role="cell">{item.sourceFile ?? (item.fallbackFrom ? `fallback: ${item.fallbackFrom}` : "未映射")}</span>
              <span role="cell">{item.confidence.toFixed(2)}</span>
              <code role="cell">{item.publicPath}</code>
              <small>{item.reason}</small>
              {item.alternates && item.alternates.length > 0 && (
                <small>候选：{item.alternates.map((alternate) => `${alternate.fileName} (${alternate.score})`).join("；")}</small>
              )}
            </div>
          )) : (
            <div role="row">
              <span role="cell">尚未生成映射</span>
              <span role="cell">运行导入脚本后显示每张原图的分配结果</span>
              <span role="cell">0.00</span>
              <code role="cell">{publicPathForCharacterAsset(reportPath)}</code>
            </div>
          )}
        </div>

        <div className="pca-dev-grid">
          <div className="pca-inline-panel">
            <h2>缺失资产</h2>
            {missingAssets.length > 0 ? (
              <ul>{missingAssets.map((asset) => <li key={asset}>{asset}</li>)}</ul>
            ) : (
              <p>当前 manifest 的导入报告未记录缺失资产。</p>
            )}
          </div>
          <div className="pca-inline-panel">
            <h2>未使用原图</h2>
            {report?.unusedSources.length ? (
              <ul>{report.unusedSources.map((source) => <li key={source}>{source}</li>)}</ul>
            ) : (
              <p>没有未使用原图，或 import-report 尚未加载。</p>
            )}
          </div>
        </div>

        <div className="pca-inline-panel">
          <h2>建议重生成</h2>
          {recommendations.length > 0 ? (
            <ul>{recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul>
          ) : (
            <p>没有低置信度或缺失项需要立即重生成。</p>
          )}
          {report?.assetMapOverride?.warnings.length ? (
            <small>asset-map.json 警告：{report.assetMapOverride.warnings.join("；")}</small>
          ) : null}
        </div>

        <details className="pca-dev-disclosure">
          <summary>manifest 预览</summary>
          <pre>{JSON.stringify(manifest, null, 2)}</pre>
        </details>
      </div>
    </InspectorPanel>
  );
}

function PresetTab({
  manifest,
  presets,
  manifestJson,
  onApply,
  onChangeJson,
  onExport,
  onImport
}: {
  manifest: AvatarManifest;
  presets: AvatarManifest[];
  manifestJson: string;
  onApply: (manifest: AvatarManifest) => void;
  onChangeJson: (json: string) => void;
  onExport: () => void;
  onImport: () => void;
}) {
  return (
    <div className="pca-avatar-studio__stack">
      <section className="pca-avatar-preset-grid">
        {presets.map((preset) => (
          <button
            className={manifest.id === preset.id ? "is-active" : ""}
            key={preset.id}
            onClick={() => onApply(preset)}
            type="button"
          >
            <Layered2DAvatar manifest={preset} state="idle" size="small" />
            <strong>{preset.name.replace("Mira · ", "")}</strong>
            <small>{preset.description}</small>
          </button>
        ))}
      </section>
      <InspectorPanel title="导入 / 导出 AvatarManifest">
        <div className="pca-actions">
          <button onClick={onExport} type="button"><Download size={16} /><span>导出 JSON</span></button>
          <button onClick={onImport} type="button"><Upload size={16} /><span>导入 JSON</span></button>
        </div>
        <textarea
          aria-label="AvatarManifest JSON"
          onChange={(event) => onChangeJson(event.target.value)}
          placeholder="导出的 AvatarManifest JSON 会显示在这里，也可以粘贴 JSON 后导入。"
          rows={8}
          value={manifestJson}
        />
      </InspectorPanel>
    </div>
  );
}

function FaceTab({ face, onUpdate }: { face: FaceShape; onUpdate: (patch: Partial<FaceShape>) => void }) {
  return (
    <InspectorPanel title="脸型">
      <SegmentedControl
        label="脸型选择"
        options={[
          ["oval", "鹅蛋脸"],
          ["round", "圆润脸"],
          ["cool", "清冷脸"],
          ["soft_v", "柔和瓜子脸"]
        ]}
        value={face.faceShape}
        onChange={(faceShape) => onUpdate({ faceShape })}
      />
      <RangeControl label="脸宽" min={30} max={70} value={face.faceWidth} onChange={(faceWidth) => onUpdate({ faceWidth })} />
      <RangeControl label="下巴长度" min={20} max={80} value={face.chinLength} onChange={(chinLength) => onUpdate({ chinLength })} />
      <RangeControl label="脸颊柔和度" min={0} max={100} value={face.jawSoftness} onChange={(jawSoftness) => onUpdate({ jawSoftness })} />
      <RangeControl label="脸颊饱满度" min={0} max={100} value={face.cheekFullness} onChange={(cheekFullness) => onUpdate({ cheekFullness })} />
    </InspectorPanel>
  );
}

function FeatureTab({ face, onUpdate }: { face: FaceShape; onUpdate: (patch: Partial<FaceShape>) => void }) {
  return (
    <InspectorPanel title="五官">
      <SegmentedControl
        label="眼型"
        options={[
          ["almond", "杏眼"],
          ["phoenix", "凤眼"],
          ["round", "圆眼"],
          ["cool", "清冷眼"]
        ]}
        value={face.eyeShape}
        onChange={(eyeShape) => onUpdate({ eyeShape })}
      />
      <RangeControl label="眼睛大小" min={20} max={90} value={face.eyeSize} onChange={(eyeSize) => onUpdate({ eyeSize })} />
      <ColorControl label="瞳色" value={face.eyeColor} onChange={(eyeColor) => onUpdate({ eyeColor })} />
      <SelectControl
        label="眉型选择"
        value={face.browStyle}
        options={[
          ["soft_arch", "柔弧眉"],
          ["straight", "平直眉"],
          ["willow", "柳叶眉"],
          ["sharp", "利落眉"]
        ]}
        onChange={(browStyle) => onUpdate({ browStyle })}
      />
      <SelectControl
        label="嘴型选择"
        value={face.mouthStyle}
        options={[
          ["gentle", "温和"],
          ["smile", "微笑"],
          ["calm", "安静"],
          ["serious", "认真"]
        ]}
        onChange={(mouthStyle) => onUpdate({ mouthStyle })}
      />
      <RangeControl label="腮红" min={0} max={100} value={face.blush} onChange={(blush) => onUpdate({ blush })} />
    </InspectorPanel>
  );
}

function HairTab({
  hair,
  material,
  onUpdate,
  onUpdateMaterial
}: {
  hair: HairSchema;
  material: MaterialSlot;
  onUpdate: (patch: Partial<HairSchema>) => void;
  onUpdateMaterial: (patch: Partial<MaterialSlot>) => void;
}) {
  const toggleSlot = (slot: string): void => {
    const nextSlots = hair.hairAccessorySlots.includes(slot)
      ? hair.hairAccessorySlots.filter((candidate) => candidate !== slot)
      : [...hair.hairAccessorySlots, slot];
    onUpdate({ hairAccessorySlots: nextSlots });
  };

  return (
    <InspectorPanel title="发型">
      <div className="pca-mode-row">
        <button onClick={() => onUpdate({ bun: "half_up", backHair: "flowing_long" })} type="button">半挽发</button>
        <button onClick={() => onUpdate({ bun: "high_bun", backHair: "braided" })} type="button">高髻</button>
        <button onClick={() => onUpdate({ backHair: "cloud_long", hairLength: 92 })} type="button">流云长发</button>
        <button onClick={() => onUpdate({ sideHair: "asymmetric" })} type="button">侧发</button>
        <button onClick={() => onUpdate({ frontHair: "straight_bangs" })} type="button">刘海</button>
      </div>
      <RangeControl label="发长" min={20} max={100} value={hair.hairLength} onChange={(hairLength) => onUpdate({ hairLength })} />
      <ColorControl label="发色" value={material.color} onChange={(color) => onUpdateMaterial({ color })} />
      <ColorControl label="高光" value={hair.highlightColor} onChange={(highlightColor) => onUpdate({ highlightColor })} />
      <div className="pca-avatar-checkbox-grid" aria-label="发饰插槽">
        {["hairpin", "ribbon", "flower", "tassel"].map((slot) => (
          <label className="pca-switch-card" key={slot}>
            <input checked={hair.hairAccessorySlots.includes(slot)} onChange={() => toggleSlot(slot)} type="checkbox" />
            <span>{slot === "hairpin" ? "发簪" : slot === "ribbon" ? "发带" : slot === "flower" ? "花饰" : "流苏"}</span>
          </label>
        ))}
      </div>
    </InspectorPanel>
  );
}

function BodyTab({ body, onUpdate }: { body: BodyShape; onUpdate: (patch: Partial<BodyShape>) => void }) {
  return (
    <InspectorPanel title="身材">
      <RangeControl label="身高" min={150} max={180} value={body.height} onChange={(height) => onUpdate({ height })} />
      <RangeControl label="头身比" min={5.8} max={8.2} step={0.1} value={body.headBodyRatio} onChange={(headBodyRatio) => onUpdate({ headBodyRatio })} />
      <RangeControl label="肩宽" min={30} max={55} value={body.shoulderWidth} onChange={(shoulderWidth) => onUpdate({ shoulderWidth })} />
      <RangeControl label="腰身" min={20} max={45} value={body.waistWidth} onChange={(waistWidth) => onUpdate({ waistWidth })} />
      <RangeControl label="手臂长度" min={40} max={70} value={body.armLength} onChange={(armLength) => onUpdate({ armLength })} />
      <RangeControl label="腿长" min={65} max={105} value={body.legLength} onChange={(legLength) => onUpdate({ legLength })} />
      <SelectControl
        label="姿态选择"
        value={body.posture}
        options={[
          ["upright", "端正"],
          ["relaxed", "放松"],
          ["elegant", "优雅"],
          ["reserved", "克制"],
          ["playful", "轻快"]
        ]}
        onChange={(posture) => onUpdate({ posture })}
      />
    </InspectorPanel>
  );
}

function OutfitTab({ outfit, onUpdate }: { outfit: OutfitSchema; onUpdate: (patch: Partial<OutfitSchema>) => void }) {
  return (
    <InspectorPanel title="服装">
      <SelectControl label="内衫" value={outfit.innerRobe} options={[
        ["jade_inner", "玉璃内衫"],
        ["moon_inner", "月白内衫"],
        ["vermillion_inner", "朱砂内衫"],
        ["ink_inner", "墨羽内衫"],
        ["scholar_inner", "天青书卷"],
        ["sakura_inner", "樱粉内衫"]
      ]} onChange={(innerRobe) => onUpdate({ innerRobe })} />
      <SelectControl label="外袍" value={outfit.outerRobe} options={[
        ["jade_outer", "玉璃外袍"],
        ["moon_outer", "月白外袍"],
        ["vermillion_outer", "朱砂外袍"],
        ["ink_outer", "墨羽外袍"],
        ["scholar_outer", "天青外袍"],
        ["sakura_outer", "樱粉外袍"]
      ]} onChange={(outerRobe) => onUpdate({ outerRobe })} />
      <SelectControl label="宽袖" value={outfit.sleeves} options={[
        ["wide_cloud", "云纹宽袖"],
        ["narrow_scholar", "书卷窄袖"],
        ["ceremonial_drop", "礼服垂袖"],
        ["layered", "叠层广袖"]
      ]} onChange={(sleeves) => onUpdate({ sleeves })} />
      <SelectControl label="披帛" value={outfit.pibo} options={[
        ["translucent_arc", "半透明弧披帛"],
        ["double_stream", "双流披帛"],
        ["short_cloud", "短云披帛"],
        ["none", "不启用"]
      ]} onChange={(pibo) => onUpdate({ pibo })} />
      <SelectControl label="腰带" value={outfit.belt} options={[
        ["jade_sash", "玉带"],
        ["gold_cord", "金绳"],
        ["silver_sash", "银带"],
        ["ribbon", "丝带"]
      ]} onChange={(belt) => onUpdate({ belt })} />
      <SelectControl label="裙摆" value={outfit.skirt} options={[
        ["flowing_panel", "流动分片"],
        ["moon_pleated", "月白褶裙"],
        ["ceremonial_train", "礼服拖尾"],
        ["short_companion", "陪伴短裙摆"]
      ]} onChange={(skirt) => onUpdate({ skirt })} />
      <SelectControl label="鞋子" value={outfit.shoes} options={[
        ["embroidered_flat", "刺绣平履"],
        ["jade_boot", "玉色短靴"],
        ["ceremony_shoe", "典礼鞋"],
        ["soft_slipper", "软底鞋"]
      ]} onChange={(shoes) => onUpdate({ shoes })} />
      <RangeControl label="刺绣强度" min={0} max={100} value={outfit.embroidery} onChange={(embroidery) => onUpdate({ embroidery })} />
      <RangeControl label="纱质透明度" min={0} max={100} value={outfit.fabricOpacity} onChange={(fabricOpacity) => onUpdate({ fabricOpacity })} />
    </InspectorPanel>
  );
}

function MaterialsTab({
  materials,
  selectedPart,
  onSelectPart,
  onUpdateMaterial
}: {
  materials: Record<AvatarPartId, MaterialSlot>;
  selectedPart: AvatarPartId;
  onSelectPart: (partId: AvatarPartId) => void;
  onUpdateMaterial: (partId: AvatarPartId, patch: Partial<MaterialSlot>) => void;
}) {
  return (
    <InspectorPanel title="材质颜色">
      <div className="pca-avatar-material-grid">
        {materialPartOrder.map((partId) => {
          const slot = materials[partId];
          return (
            <article className={selectedPart === partId ? "is-active" : ""} key={partId}>
              <button onClick={() => onSelectPart(partId)} type="button">{avatarPartDisplayNames[partId]}</button>
              <input aria-label={`${avatarPartDisplayNames[partId]}颜色`} onChange={(event) => onUpdateMaterial(partId, { color: event.target.value })} type="color" value={slot.color} />
              <input aria-label={`${avatarPartDisplayNames[partId]}副色`} onChange={(event) => onUpdateMaterial(partId, { secondaryColor: event.target.value })} type="color" value={slot.secondaryColor} />
              <select aria-label={`${avatarPartDisplayNames[partId]}材质`} onChange={(event) => onUpdateMaterial(partId, { material: event.target.value as MaterialSlot["material"] })} value={slot.material}>
                {avatarMaterialKinds.map((kind) => <option key={kind} value={kind}>{materialLabel(kind)}</option>)}
              </select>
              <input aria-label={`${avatarPartDisplayNames[partId]}透明度`} max="1" min="0" onChange={(event) => onUpdateMaterial(partId, { opacity: Number(event.target.value) })} step="0.01" type="range" value={slot.opacity} />
            </article>
          );
        })}
      </div>
      <small>可单独调色的关键部位：{visibleMaterialPartIds.map((partId) => avatarPartDisplayNames[partId]).join("、")}。</small>
    </InspectorPanel>
  );
}

function AccessoryTab({
  accessories,
  onUpdate
}: {
  accessories: AccessorySchema;
  onUpdate: (patch: Partial<AccessorySchema>) => void;
}) {
  return (
    <InspectorPanel title="配饰">
      <SelectControl label="发簪" value={accessories.hairpin} options={[
        ["jade_pin", "玉簪"],
        ["gold_pin", "金簪"],
        ["silver_pin", "银簪"],
        ["flower_pin", "花簪"],
        ["none", "不启用"]
      ]} onChange={(hairpin) => onUpdate({ hairpin })} />
      <SelectControl label="耳饰" value={accessories.earrings} options={[
        ["pearl_drop", "珍珠耳饰"],
        ["jade_drop", "玉坠耳饰"],
        ["gold_drop", "金坠耳饰"],
        ["none", "不启用"]
      ]} onChange={(earrings) => onUpdate({ earrings })} />
      <SelectControl label="流苏" value={accessories.tassel} options={[
        ["short", "短流苏"],
        ["long", "长流苏"],
        ["double", "双流苏"],
        ["none", "不启用"]
      ]} onChange={(tassel) => onUpdate({ tassel })} />
      <SelectControl label="玉佩" value={accessories.jadePendant} options={[
        ["round_jade", "圆玉佩"],
        ["leaf_jade", "叶形玉佩"],
        ["none", "不启用"]
      ]} onChange={(jadePendant) => onUpdate({ jadePendant })} />
      <SelectControl label="背景窗/舞台" value={accessories.backgroundStage} options={[
        ["jade_screen", "玉璃屏风"],
        ["moon_window", "月白窗"],
        ["red_ceremony", "朱砂典礼台"],
        ["ink_stage", "墨羽暗台"],
        ["scholar_window", "天青书窗"],
        ["sakura_room", "樱粉房间"]
      ]} onChange={(backgroundStage) => onUpdate({ backgroundStage })} />
    </InspectorPanel>
  );
}

function MotionTab({ onPreview }: { onPreview: (state: AvatarState) => void }) {
  const motions: Array<[AvatarState, string]> = [
    ["idle", "待机"],
    ["happy", "微笑"],
    ["thinking", "思考"],
    ["speaking", "说话"],
    ["happy", "开心"],
    ["confused", "困惑"],
    ["annoyed", "生气"],
    ["sleepy", "困倦"],
    ["peeking", "探头"],
    ["edge_sitting", "坐在边缘"]
  ];
  return (
    <InspectorPanel title="动作表情">
      <div className="pca-avatar-motion-grid">
        {motions.map(([state, label], index) => (
          <button key={`${state}:${index}`} onClick={() => onPreview(state)} type="button">{label}</button>
        ))}
      </div>
    </InspectorPanel>
  );
}

function AiGenerationTab({
  aiPrompt,
  developerMode,
  job,
  providerLabel,
  referenceName,
  onChangePrompt,
  onImport,
  onReferenceName,
  onRun
}: {
  aiPrompt: string;
  developerMode: boolean;
  job: AssetGenerationJob | undefined;
  providerLabel: string;
  referenceName: string;
  onChangePrompt: (value: string) => void;
  onImport: () => void;
  onReferenceName: (value: string) => void;
  onRun: (kind: "concept" | "turnaround" | "texture" | "3d") => void;
}) {
  const asset = job?.assets[0];
  return (
    <InspectorPanel title="AI 生成">
      <label className="pca-field">
        <span>角色描述输入</span>
        <textarea onChange={(event) => onChangePrompt(event.target.value)} rows={5} value={aiPrompt} />
      </label>
      <label className="pca-field">
        <span>参考图上传入口</span>
        <input
          aria-label="参考图上传入口"
          onChange={(event) => onReferenceName(event.target.files?.[0]?.name ?? "")}
          type="file"
        />
      </label>
      {referenceName && <StatusPill tone="info">已选择参考图：{referenceName}</StatusPill>}
      <div className="pca-actions">
        <button onClick={() => void onRun("concept")} type="button"><Image size={16} /><span>生成设定图</span></button>
        <button onClick={() => void onRun("turnaround")} type="button"><Wand2 size={16} /><span>生成多角度参考</span></button>
        <button onClick={() => void onRun("3d")} type="button"><Box size={16} /><span>生成 3D 草稿</span></button>
        <button onClick={() => void onRun("texture")} type="button"><Shuffle size={16} /><span>生成贴图变体</span></button>
      </div>
      <div className="pca-avatar-ai-status">
        <strong>任务状态</strong>
        <span>{job ? `${job.provider} / ${job.kind} / ${job.status} / ${job.progress}%` : "尚未开始"}</span>
        <small>成本提示：{job ? `$${job.costEstimateUsd.toFixed(2)} mock estimate` : "未配置真实 API 时使用 MockAssetProvider，不产生实际费用。"} {developerMode ? `当前 provider: ${providerLabel}` : ""}</small>
      </div>
      {asset ? (
        <div className="pca-avatar-generated-preview">
          <img alt={asset.title} src={asset.previewUrl} />
          <div>
            <strong>结果预览</strong>
            <p>{asset.title}</p>
            <small>{Object.entries(asset.metadata).map(([key, value]) => `${key}: ${value}`).join(" / ")}</small>
            <button onClick={() => void onImport()} type="button"><Upload size={16} /><span>导入为角色预设</span></button>
          </div>
        </div>
      ) : (
        <EmptyState title="没有生成结果" body="输入描述后生成设定图、多角度参考或 3D 草稿；结果会先进入预览，不会直接覆盖当前角色。" />
      )}
    </InspectorPanel>
  );
}

export function AvatarAssetDeveloperConfigPanel({
  config,
  onChange
}: {
  config: AssetGenerationConfig;
  onChange: (config: AssetGenerationConfig) => void;
}) {
  const [testResult, setTestResult] = useState<AssetProviderTestResult>();
  const update = (patch: Partial<AssetGenerationConfig>): void => onChange({ ...config, ...patch });
  const testConnection = async (): Promise<void> => {
    const provider = createAssetGenerationProvider(config);
    setTestResult(await provider.testConnection());
  };

  return (
    <InspectorPanel title="AI 资产生成配置">
      <div className="pca-dev-grid">
        <SelectControl
          label="provider"
          value={config.provider}
          options={[
            ["mock", "MockAssetProvider"],
            ["comfyui", "ComfyUI"],
            ["meshy", "Meshy"],
            ["tripo", "Tripo"]
          ]}
          onChange={(provider) => update({ provider: provider as AssetGenerationProviderId })}
        />
        <label className="pca-field">
          <span>API key</span>
          <input onChange={(event) => update({ apiKey: event.target.value })} type="password" value={config.apiKey ?? ""} />
        </label>
        <label className="pca-field">
          <span>base URL</span>
          <input onChange={(event) => update({ baseUrl: event.target.value })} value={config.baseUrl} />
        </label>
        <label className="pca-field">
          <span>model/version</span>
          <input onChange={(event) => update({ modelVersion: event.target.value })} value={config.modelVersion} />
        </label>
      </div>
      <label className="pca-switch-card">
        <input checked={config.costWarning} onChange={(event) => update({ costWarning: event.target.checked })} type="checkbox" />
        <span>cost warning</span>
      </label>
      <button onClick={() => void testConnection()} type="button"><Check size={16} /><span>test connection</span></button>
      {testResult && (
        <div className="pca-avatar-ai-status">
          <StatusPill tone={testResult.ok ? "good" : "warn"}>{testResult.ok ? "success" : "needs config"}</StatusPill>
          <p>{testResult.message}</p>
          <small>{testResult.provider} / {testResult.latencyMs}ms</small>
        </div>
      )}
    </InspectorPanel>
  );
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: Array<[T, string]>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="pca-field">
      <span>{label}</span>
      <div className="pca-mode-row">
        {options.map(([id, optionLabel]) => (
          <button className={value === id ? "is-active" : ""} key={id} onClick={() => onChange(id)} type="button">
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectControl<T extends string>({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: Array<[T, string]>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <label className="pca-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value as T)} value={value}>
        {options.map(([id, optionLabel]) => <option key={id} value={id}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function RangeControl({
  label,
  max,
  min,
  step = 1,
  value,
  onChange
}: {
  label: string;
  max: number;
  min: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="pca-field pca-avatar-range">
      <span>{label}<strong>{value}</strong></span>
      <input max={max} min={min} onChange={(event) => onChange(Number(event.target.value))} step={step} type="range" value={value} />
    </label>
  );
}

function ColorControl({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="pca-field pca-avatar-color">
      <span>{label}</span>
      <input onChange={(event) => onChange(event.target.value)} type="color" value={value} />
    </label>
  );
}

function materialLabel(kind: MaterialSlot["material"]): string {
  const labels: Record<MaterialSlot["material"], string> = {
    silk: "丝绸",
    gauze: "纱",
    jade: "玉",
    pearl: "珍珠",
    gold: "金",
    silver: "银",
    cotton: "棉",
    embroidered: "刺绣"
  };
  return labels[kind];
}

interface PixelPossessionSectionProps {
  displayStyle: "asset" | "pixel";
  portrait?: PixelPortrait | undefined;
  onChangeDisplayStyle?: ((style: "asset" | "pixel") => void) | undefined;
  onChangePixelPortrait?: ((portrait: PixelPortrait) => void) | undefined;
}

function PixelPossessionSection({
  displayStyle,
  onChangeDisplayStyle,
  onChangePixelPortrait,
  portrait
}: PixelPossessionSectionProps) {
  const [pixelSize, setPixelSize] = useState<number>(portrait?.size ?? 16);
  const [status, setStatus] = useState<string>(
    portrait?.origin === "upload"
      ? `已载入上传像素：${portrait.sourceName ?? portrait.name}`
      : "当前使用内置像素角色。"
  );

  const activePortrait = portrait ?? createDefaultPixelPortrait();

  const handleReset = (): void => {
    if (!onChangePixelPortrait) return;
    const defaultPortrait = createDefaultPixelPortrait();
    onChangePixelPortrait(defaultPortrait);
    setPixelSize(defaultPortrait.size);
    setStatus("已恢复默认像素方块。");
  };

  const handleFile = async (file: File): Promise<void> => {
    if (!onChangePixelPortrait) return;
    setStatus(`正在像素化 ${file.name}...`);
    try {
      const dataUrl = await fileToDataUrl(file);
      const image = await loadImage(dataUrl);
      const next = pixelizeImage(image, {
        size: pixelSize,
        sourceName: file.name
      });
      onChangePixelPortrait(next);
      setStatus(`已将 ${file.name} 像素化为 ${pixelSize}×${pixelSize} 方块。`);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `像素化失败：${error.message}`
          : "像素化失败。"
      );
    }
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    event.target.value = "";
  };

  return (
    <InspectorPanel title="像素方块·夺舍容相">
      <p className="pca-muted-copy">
        参考 Claude Code 的像素头像风格，用小方格呈现玉璃清仪。可上传图像自动像素化，生成随桌面和浏览器一同显示的像素分身。
      </p>
      <div className="pca-pixel-possession">
        <div className="pca-pixel-possession__preview">
          <PixelPortraitStage
            badge="像素方块"
            portrait={activePortrait}
            size="studio"
            state="idle"
          />
          <StatusPill tone={displayStyle === "pixel" ? "good" : "info"}>
            {displayStyle === "pixel" ? "像素舞台已启用" : "资产舞台运行中"}
          </StatusPill>
        </div>
        <div className="pca-pixel-possession__controls">
          <div className="pca-mode-row">
            <button
              aria-pressed={displayStyle === "asset"}
              className={displayStyle === "asset" ? "is-active" : ""}
              disabled={!onChangeDisplayStyle}
              onClick={() => onChangeDisplayStyle?.("asset")}
              type="button"
            >
              资产图相
            </button>
            <button
              aria-pressed={displayStyle === "pixel"}
              className={displayStyle === "pixel" ? "is-active" : ""}
              disabled={!onChangeDisplayStyle}
              onClick={() => onChangeDisplayStyle?.("pixel")}
              type="button"
            >
              像素方块
            </button>
          </div>
          <label className="pca-field">
            <span>方格分辨率：{pixelSize}×{pixelSize}</span>
            <input
              max={32}
              min={8}
              onChange={(event) => setPixelSize(Number(event.target.value))}
              step={2}
              type="range"
              value={pixelSize}
            />
          </label>
          <label className="pca-field pca-pixel-upload-field">
            <span>上传图像（自动像素化）</span>
            <input
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileInput}
              type="file"
            />
          </label>
          <div className="pca-actions">
            <button onClick={handleReset} type="button">
              恢复默认像素
            </button>
          </div>
          <small>{status}</small>
          <small>
            像素方块会跟随角色状态呼吸、发光、显示记忆/护道边框，并可在桌面小窗中启用。
          </small>
        </div>
      </div>
    </InspectorPanel>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = document.createElement("img");
    image.onerror = () => reject(new Error("Failed to load image"));
    image.onload = () => resolve(image);
    image.src = src;
  });
}
