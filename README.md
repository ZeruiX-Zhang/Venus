# Personal Character Agent · 古风 AI 角色伴侣

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Tests](https://img.shields.io/badge/tests-150%2B%20passing-2ea44f)](#-tests)
[![PBT](https://img.shields.io/badge/property--based-fast--check-blueviolet)](https://github.com/dubzzz/fast-check)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license)

> 一款本地优先、跨 Web / 桌面 / CLI 的中国古风 AI 角色伴侣产品。
> 上传一张立绘,就能看到她在舞台上呼吸、眨眼、袖摆;再上传 GLB,就能切到真实 3D。

[English README](#english) · [项目经历(简历用)](docs/PROJECT_EXPERIENCE.md) · [架构文档](docs/guofeng-avatar-stage.md)

---

## ✨ 这是什么

Personal Character Agent 是一个 TypeScript-first 的本地 AI 角色伴侣产品原型。它把"一张静态立绘 + 文本对话"扩展成:

- 🎭 **古风角色舞台**:三种渲染模式(纯程序化 / 2.5D 立绘动画 / GLB 3D),按用户上传的资产自动切换
- 🧠 **Memory-as-Skills 长期记忆**:可寻址的记忆技能注册表,而不是一锅大上下文
- 👤 **人格矩阵**:多套人格 core,小说导入、覆写、用户自创
- 🛡️ **未成年安全模式**:策略变更时已上传资产实时复评,被阻断的资产从渲染输出过滤
- 🖼️ **图生 3D 适配器契约**:为 Tripo / Meshy / Hunyuan3D 类服务预留接口,Mock 适配器把整条管线先跑通
- 🌐 **跨平台**:Web 浏览器 / Tauri 桌面悬浮宠 / 命令行像素伴侣,共享同一套 runtime

---

## 🪞 看一眼

> 把一张古风立绘拖进资产仓库,选 12 种状态(idle / thinking / speaking / happy / sleepy …),角色立刻在舞台上反应。

```
┌─────────────────────────────────────────────────────────────┐
│  🎭 古风角色舞台                  [开发者模式] [未成年模式]    │
│                                                              │
│       ┌──────────────────────────────┐                       │
│       │                              │                       │
│       │         (你的立绘)            │  ← 呼吸 · 眨眼 · 袖摆   │
│       │      呼吸中 · 思考时刻         │  ← 状态驱动           │
│       │                              │                       │
│       └──────────────────────────────┘                       │
│                                                              │
│  状态:[idle] [listening] [thinking] [speaking] [happy] …    │
│                                                              │
│  📥 资产仓库                                                  │
│   立绘  hanfu.png  · 1.4 MB  · [设为主角]  [生成 3D]          │
│   GLB   model.glb · 6.8 MB  · [设为主角]                      │
└─────────────────────────────────────────────────────────────┘
```

(实际界面包含水墨粒子飘动、灯光呼吸、宋宫色彩。运行后访问 `http://localhost:5173/#/guofeng` 查看。)

---

## 🎯 适合谁看

- **想了解 spec-driven 开发流程的工程师**:本仓库 `.kiro/specs/guofeng-avatar-stage/` 下完整保留了从需求 → 设计 → 任务 → 实现的链路。
- **关心 property-based testing 实战的工程师**:4 条 fast-check 属性测试覆盖纯函数性、生命周期单调性、单激活不变量、源资产保留等核心契约。
- **正在做 AI 伴侣 / VTuber / 数字人产品的团队**:一份本地优先、可插拔、安全策略闭环的参考实现。
- **HR / 面试官**:这是 [我的项目经历](docs/PROJECT_EXPERIENCE.md) 的代码与文档佐证。

---

## 🚀 快速开始

```bash
pnpm install
pnpm dev:web
```

打开 `http://localhost:5173/`,点击右上角 **「前往古风舞台预览 →」**,或直接访问:

```
http://localhost:5173/#/guofeng
```

无需 API 密钥,默认 mock 模式即可完整体验。

> Windows 用户如果 corepack 未配置好,可以用 `node .corepack\v1\pnpm\9.15.4\bin\pnpm.cjs install` 兜底。

### 跑测试

```bash
pnpm typecheck    # 19 个 workspace 项目全部通过
pnpm test         # 150+ 测试,含 4 条 fast-check 属性
pnpm lint
pnpm build
```

---

## 🧪 Tests

| 包                           | 测试数 | 重点                                      |
|-----------------------------|------:|-------------------------------------------|
| `avatar-runtime`            |    61 | 含 4 条 fast-check 属性测试                 |
| `safety-runtime`            |    25 | adult / minor / strict 三模式 reason codes |
| `ui`                        |    58 | SSR 快照 + 可访问性契约                     |
| `agent-runtime` 等其它包      |    50+| 已有的运行时与人格矩阵测试                   |

属性测试(fast-check)覆盖:

- **纯函数性 / 模式优先级 / 阻断闭包** — `resolveStageMode` 1000 次随机输入
- **幂等性 / 区域边界** — `templatePortraitLayerPlanner` 1000 次随机输入
- **总映射 / 幅度边界 / 减少动效单调性** — `stateMotionMap` + `applyReducedMotion`
- **生命周期单调性 / 源资产保留 / 密钥门禁** — `MockImage23DAdapter`
- **哈希唯一性 / 单激活不变量** — `AssetLibraryStore` 随机操作序列

---

## 🏗️ 架构

```
apps/
├── web/         · React + Vite,主应用 + #/guofeng 古风预览路由
├── desktop/     · Tauri webview shell,native always-on-top / opacity controls
└── cli/         · Node.js 像素伴侣,共用同一 CompanionRuntime

packages/
├── agent-runtime    · 确定性工作流、trace、上下文装配
├── memory-runtime   · Memory-as-Skills 注册表、读写管线
├── persona-runtime  · 人格矩阵、小说导入、evaluator
├── safety-runtime   · 未成年模式、身份策略、资产安全评估
├── avatar-runtime   · 角色状态机 + 古风舞台子系统(本次重点)
│   └── assetLibrary/  · StageMode 解析、层规划、动效预设、资产仓库、IDB 后端、图生 3D 适配器
├── avatar-assets    · 角色资产 manifest、验证、路径解析、玉璃清仪默认资产
├── avatar-model     · AvatarManifest 模型、6 种古风预设
├── asset-generation · MockAssetProvider + ComfyUI/Meshy/Tripo 适配器
├── voice-runtime    · mock / 浏览器 TTS、嘴部同步事件
├── model-gateway    · OpenAI 兼容 gateway、SecretStore 抽象
└── ui               · 共享 React UI(Stage、Chat、Memory、Persona、Safety、Provider、Voice、AssetLibraryPanel、Portrait25DStage、StageInternalsPanel)
```

---

## 🎨 古风角色舞台 — 本次的重点子系统

### 三种渲染模式

```
StageMode = "procedural" | "portrait_2_5d" | "glb_3d"
```

由纯函数 `resolveStageMode` 解析,优先级 GLB → 立绘 → 程序化。被安全策略阻断的资产自动跳过。

### 关键设计

- **2.5D 动画用纯 CSS 实现,零 canvas / 零 rAF**:把同一张 blob URL 的 `<img>` 用 7 个 `clip-path: inset(...)` 切成命名层,通过 CSS 变量驱动呼吸 / 眨眼 / 袖摆 / 水墨粒子。OS 级 `prefers-reduced-motion` 自动让全部幅度单调下降。
- **可观察的资产仓库 + IndexedDB 持久化**:`useSyncExternalStore` 友好,SHA-256 hash 提供天然去重,rehydrate 时校验字节完整性,缺失 / 哈希不匹配的资产以 `missing` 标记保留。
- **图生 3D 是契约,不是耦合**:任何提供方实现 `Image23DAdapter` 接口即可注册;`MockImage23DAdapter` 把 `submit → poll → succeeded` 管线打通供 demo / 测试使用。
- **安全闭环**:`safety-runtime.createAssetSafetyEvaluator()` 在上传与策略切换时评估;`reevaluateAll(evaluators)` 在切换 adult/minor 时复评全部资产。

### 12 种角色状态

每种状态对应一个 `MotionPreset`:`breathSeconds ∈ [2.0, 8.0]`、`floatPixels ∈ [0, 12]`、`sleeveSwayDeg ∈ [0, 6]`、`particleDensity ∈ [0, 1]`、tone tint、嘴型动画、眨眼模式。属性测试保证所有数值始终落在范围内,reduced-motion 后单调下降。

详细设计见 [docs/guofeng-avatar-stage.md](docs/guofeng-avatar-stage.md)。

---

## 🔒 安全 & 隐私

- 所有资产保存在浏览器 IndexedDB / Tauri 应用数据目录,**不上传到任何服务器**(除非你显式调用图生 3D 服务)。
- 未成年模式拦截不支持的格式、超出大小、可能的身份冒充关键字。
- 4 种 reason codes:`format_unsupported` / `size_exceeded` / `minor_mode_blocked` / `identity_policy_blocked`,Developer Mode 可见。
- 模型供应商 API key 通过 `SecretStore` 抽象保存,Web 端用 masked storage,Tauri 端预留 Stronghold 适配器。

---

## 🛣️ 路线图

- [x] 古风 2.5D 舞台 + 12 种状态动画
- [x] GLB 上传 + three.js 渲染槽
- [x] 图生 3D 适配器契约 + Mock 实现
- [x] IndexedDB 资产仓库 + 哈希校验
- [x] 未成年安全模式联动
- [x] 开发者模式调试面板
- [ ] Tauri Stronghold 真实集成
- [ ] 真实图生 3D 提供方(Tripo / Meshy / Hunyuan3D)适配器包
- [ ] Live2D Cubism 输入桥
- [ ] Playwright 视觉回归种子图
- [ ] 已签名的桌面安装包

---

## 🤝 参与

```bash
pnpm install
pnpm dev:web
```

任何修改请确保:

```bash
pnpm typecheck && pnpm test && pnpm lint && pnpm build
```

仓库根目录的 [AGENTS.md](AGENTS.md) 是给协作者(包括 AI agent)的契约文档,涵盖代码风格、安全规则、Definition of Done。

---

## 📄 License

MIT — 见 [LICENSE](LICENSE)(若仓库尚未添加 LICENSE,请视为预留)。

第三方资源(默认角色 `玉璃清仪` 立绘等)版权归原作者,本仓库仅作演示用途。

---

## English

**Personal Character Agent** is a local-first, TypeScript-strict AI character companion product across Web / Desktop / CLI, themed around classical Chinese aesthetics (古风).

**Highlights**

- 🎭 **Three rendering modes** — procedural fallback, 2.5D portrait stage (pure CSS, no canvas), GLB 3D (three.js / `@react-three/fiber`), dispatched by a pure-functional `resolveStageMode`.
- 🧠 **Memory-as-Skills** registry instead of one giant prompt blob.
- 🛡️ **Minor-safe mode** with re-evaluation on profile change.
- 🖼️ **Pluggable image-to-3D adapter** contract for Tripo / Meshy / Hunyuan3D-class services; `MockImage23DAdapter` ships out of the box.
- 🧪 **150+ tests** including 4 fast-check property suites covering purity, lifecycle monotonicity, single-active invariants, and hash uniqueness.
- 🌐 Web + Tauri desktop floating pet + Node.js CLI pixel companion, shared runtime.

**Quick start**

```bash
pnpm install
pnpm dev:web
# then open http://localhost:5173/#/guofeng
```

Drag in a hanfu illustration. Watch it breathe and blink. Switch to minor-safe mode and see uploads get rejected with calm reasoning. Open Developer Mode to inspect resolved stage mode, layer plan, motion preset, adapter status, and recent events.

**Repository layout** is a pnpm monorepo with 19 workspace projects. Architecture and contracts are documented in [docs/guofeng-avatar-stage.md](docs/guofeng-avatar-stage.md). Project résumé text in Chinese and English is at [docs/PROJECT_EXPERIENCE.md](docs/PROJECT_EXPERIENCE.md).
