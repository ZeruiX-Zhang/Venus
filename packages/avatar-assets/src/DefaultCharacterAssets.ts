import type {
  CharacterAssetCompletenessItem,
  CharacterAssetImportSlot,
  CharacterAssetManifest,
  CharacterPortraitId
} from "./CharacterAssetManifest";

export const DEFAULT_CHARACTER_ASSET_ID = "yuli-qingyi";
export const DEFAULT_CHARACTER_DISPLAY_NAME = "玉璃清仪";
export const DEFAULT_CHARACTER_ASSET_ROOT = "/assets/characters/yuli-qingyi";

const yuliRoot = "public/assets/characters/yuli-qingyi";

export const yuliQingyiManifest = {
  id: DEFAULT_CHARACTER_ASSET_ID,
  displayName: DEFAULT_CHARACTER_DISPLAY_NAME,
  description: "月白与浅玉绿配色的古风桌面陪伴角色，温柔、清雅、安静、知性。",
  styleTags: [
    "中国古风",
    "月白",
    "浅玉绿",
    "温柔",
    "清雅",
    "桌面陪伴",
    "高级 3D 角色风格"
  ],
  assetRoot: DEFAULT_CHARACTER_ASSET_ROOT,
  assets: {
    stage: {
      fullbodyFront: `${DEFAULT_CHARACTER_ASSET_ROOT}/stage/fullbody-front.png`,
      halfbody: `${DEFAULT_CHARACTER_ASSET_ROOT}/stage/halfbody.png`,
      transparentFullbody: `${DEFAULT_CHARACTER_ASSET_ROOT}/stage/transparent-fullbody.png`
    },
    reference: {
      turnaroundSheet: `${DEFAULT_CHARACTER_ASSET_ROOT}/reference/turnaround-sheet.png`,
      materialDetails: `${DEFAULT_CHARACTER_ASSET_ROOT}/reference/material-details.png`,
      actionStates: `${DEFAULT_CHARACTER_ASSET_ROOT}/reference/action-states.png`
    },
    portraits: {
      avatar: `${DEFAULT_CHARACTER_ASSET_ROOT}/portraits/avatar.png`,
      expressionSheet: `${DEFAULT_CHARACTER_ASSET_ROOT}/portraits/expression-sheet.png`,
      neutral: `${DEFAULT_CHARACTER_ASSET_ROOT}/portraits/chat-neutral.png`,
      smile: `${DEFAULT_CHARACTER_ASSET_ROOT}/portraits/chat-smile.png`,
      thinking: `${DEFAULT_CHARACTER_ASSET_ROOT}/portraits/chat-thinking.png`,
      confused: `${DEFAULT_CHARACTER_ASSET_ROOT}/portraits/chat-confused.png`,
      shy: `${DEFAULT_CHARACTER_ASSET_ROOT}/portraits/chat-shy.png`,
      annoyed: `${DEFAULT_CHARACTER_ASSET_ROOT}/portraits/chat-annoyed.png`
    },
    thumbnails: {
      presetCard: `${DEFAULT_CHARACTER_ASSET_ROOT}/thumbnails/preset-card.png`
    },
    generated: {
      contactSheet: `${DEFAULT_CHARACTER_ASSET_ROOT}/generated/contact-sheet.png`,
      importReport: `${DEFAULT_CHARACTER_ASSET_ROOT}/generated/import-report.json`
    }
  },
  palette: {
    skin: "#F2C6AE",
    hair: "#111111",
    innerCloth: "#F6F1E7",
    outerCloth: "#AFC2B1",
    scarf: "#DDE8DD",
    belt: "#71836E",
    ornament: "#B7D8C2",
    embroidery: "#D7C48A"
  },
  runtimeAssets: {
    vrm: "runtime/yuli-qingyi.vrm",
    live2dModelJson: "runtime/live2d/model.json",
    layeredPsd: "source/yuli-qingyi-layered.psd"
  },
  credits: {
    source: "user-provided-local-asset",
    license: "user-owned-or-authorized"
  },
  importInfo: {
    sourceDir: "_asset_intake/yuli-qingyi-raw",
    generatedAt: "not-imported",
    mappingConfidence: {}
  }
} satisfies CharacterAssetManifest;

export const defaultCharacterManifests = [yuliQingyiManifest] as const;

export const yuliQingyiImportSlots = [
  {
    key: "assets.stage.fullbodyFront",
    label: "默认舞台全身图",
    path: `${yuliRoot}/stage/fullbody-front.png`,
    recommendedSize: "PNG/WebP，建议至少 1536px 高；WebP 与 PNG 同时存在时优先 WebP。",
    purpose: "首页主舞台、桌面舞台、默认角色全身预览。",
    required: true
  },
  {
    key: "assets.stage.halfbody",
    label: "聊天/小窗半身图",
    path: `${yuliRoot}/stage/halfbody.png`,
    recommendedSize: "PNG/WebP，建议至少 1200px 高。",
    purpose: "聊天区、桌面小窗、角色工坊半身预览。",
    required: false
  },
  {
    key: "assets.stage.transparentFullbody",
    label: "透明背景全身图",
    path: `${yuliRoot}/stage/transparent-fullbody.png`,
    recommendedSize: "PNG/WebP，建议保留透明背景；没有透明图时导入器会用全身图 fallback。",
    purpose: "桌面悬浮、舞台叠加、透明窗口。",
    required: false
  },
  {
    key: "assets.portraits.avatar",
    label: "聊天头像",
    path: `${yuliRoot}/portraits/avatar.png`,
    recommendedSize: "1024x1024 PNG/WebP。",
    purpose: "聊天头像、状态栏、身份区域。",
    required: false
  },
  {
    key: "assets.thumbnails.presetCard",
    label: "角色预设卡",
    path: `${yuliRoot}/thumbnails/preset-card.png`,
    recommendedSize: "4:5 或 1024x1400 竖图 PNG/WebP。",
    purpose: "角色资产工坊的预设卡封面。",
    required: false
  },
  {
    key: "assets.reference.turnaroundSheet",
    label: "四视图总设定图",
    path: `${yuliRoot}/reference/turnaround-sheet.png`,
    recommendedSize: "建议至少 2048px 宽 PNG/WebP。",
    purpose: "角色工坊四视图展示。",
    required: false
  },
  {
    key: "assets.reference.materialDetails",
    label: "材质与配饰细节图",
    path: `${yuliRoot}/reference/material-details.png`,
    recommendedSize: "PNG/WebP，建议至少 1600px 宽。",
    purpose: "展示服装材质、玉饰、刺绣和配色细节。",
    required: false
  },
  {
    key: "assets.portraits.expressionSheet",
    label: "表情设定图",
    path: `${yuliRoot}/portraits/expression-sheet.png`,
    recommendedSize: "PNG/WebP，建议至少 2048px 宽。",
    purpose: "展示表情头像、聊天表情和情绪参考。",
    required: false
  },
  {
    key: "assets.reference.actionStates",
    label: "动作状态图",
    path: `${yuliRoot}/reference/action-states.png`,
    recommendedSize: "PNG/WebP，建议至少 2048px 宽。",
    purpose: "展示待机、说话、思考、困惑等动作状态。",
    required: false
  },
  {
    key: "assets.portraits.*",
    label: "表情图集",
    path: `${yuliRoot}/portraits/{chat-neutral,chat-smile,chat-thinking,chat-confused,chat-shy,chat-annoyed}.png`,
    recommendedSize: "1024x1024 或 1200px 高半身头像 PNG/WebP。",
    purpose: "聊天表情、思考、害羞、困惑和安全状态。",
    required: false
  }
] as const satisfies readonly CharacterAssetImportSlot[];

const portraitLabels: Record<CharacterPortraitId, string> = {
  neutral: "neutral 表情",
  smile: "smile 表情",
  thinking: "thinking 表情",
  confused: "confused 表情",
  shy: "shy 表情",
  annoyed: "annoyed 表情"
};

export const getYuliQingyiCompletenessItems = (): CharacterAssetCompletenessItem[] => [
  {
    key: "assets.stage.fullbodyFront",
    label: "默认舞台全身图",
    manifestPath: yuliQingyiManifest.assets.stage.fullbodyFront,
    expectedPublicPath: `${yuliRoot}/stage/fullbody-front.png`,
    required: true
  },
  {
    key: "assets.stage.halfbody",
    label: "聊天/小窗半身图",
    manifestPath: yuliQingyiManifest.assets.stage.halfbody,
    expectedPublicPath: `${yuliRoot}/stage/halfbody.png`,
    required: false
  },
  {
    key: "assets.stage.transparentFullbody",
    label: "透明背景全身图",
    manifestPath: yuliQingyiManifest.assets.stage.transparentFullbody,
    expectedPublicPath: `${yuliRoot}/stage/transparent-fullbody.png`,
    required: false
  },
  {
    key: "assets.portraits.avatar",
    label: "聊天头像",
    manifestPath: yuliQingyiManifest.assets.portraits?.avatar,
    expectedPublicPath: `${yuliRoot}/portraits/avatar.png`,
    required: false
  },
  {
    key: "assets.thumbnails.presetCard",
    label: "角色预设卡",
    manifestPath: yuliQingyiManifest.assets.thumbnails?.presetCard,
    expectedPublicPath: `${yuliRoot}/thumbnails/preset-card.png`,
    required: false
  },
  {
    key: "assets.reference.turnaroundSheet",
    label: "四视图总设定图",
    manifestPath: yuliQingyiManifest.assets.reference?.turnaroundSheet,
    expectedPublicPath: `${yuliRoot}/reference/turnaround-sheet.png`,
    required: false
  },
  {
    key: "assets.portraits.expressionSheet",
    label: "表情设定图",
    manifestPath: yuliQingyiManifest.assets.portraits?.expressionSheet,
    expectedPublicPath: `${yuliRoot}/portraits/expression-sheet.png`,
    required: false
  },
  {
    key: "assets.reference.actionStates",
    label: "动作状态图",
    manifestPath: yuliQingyiManifest.assets.reference?.actionStates,
    expectedPublicPath: `${yuliRoot}/reference/action-states.png`,
    required: false
  },
  {
    key: "assets.reference.materialDetails",
    label: "材质与配饰细节图",
    manifestPath: yuliQingyiManifest.assets.reference?.materialDetails,
    expectedPublicPath: `${yuliRoot}/reference/material-details.png`,
    required: false
  },
  {
    key: "assets.generated.contactSheet",
    label: "导入 contact sheet",
    manifestPath: yuliQingyiManifest.assets.generated?.contactSheet,
    expectedPublicPath: `${yuliRoot}/generated/contact-sheet.png`,
    required: false
  },
  ...(["neutral", "smile", "thinking", "confused", "shy", "annoyed"] as const).map(
    (portrait): CharacterAssetCompletenessItem => ({
      key: `assets.portraits.${portrait}`,
      label: portraitLabels[portrait],
      manifestPath: yuliQingyiManifest.assets.portraits?.[portrait],
      expectedPublicPath: `${yuliRoot}/portraits/chat-${portrait}.png`,
      required: false
    })
  )
];
