# Venus 项目交接记忆（给新会话）

> 这是一次跨会话交接。读完即可无缝接手。沟通用中文、代码/注释用英文（用户偏好）。

## 项目是什么
**Venus**：本地优先、古风美学的 AI 桌面陪伴。核心愿景 = **沉浸式陪伴用户喜欢的小说人物**。
pnpm + TypeScript + React 19 + Vite monorepo；桌面端用 Tauri v2。角色「玉璃清仪」。

## 怎么跑
- 网页：`pnpm dev:web` → http://127.0.0.1:5173
- 桌面：`source ~/.cargo/env && pnpm dev:desktop:tauri`（Rust 1.96 已装；首次编译慢，之后快）
- 检查：`pnpm exec tsc --noEmit -p packages/ui/tsconfig.json`、`pnpm exec vitest run packages/ui`、`pnpm --filter @personal-character-agent/web build`
- 浏览器扩展（Claude in Chrome）整段会话都连不上 → 改动靠**用户截图**验证。

## ⚠️ 关键决策（下阶段主线）
**主形象从 3D 改为「2D 立绘为主 + 光点氛围」**。原因：消费级文本/图转3D（Tripo）质量撑不起精致陪伴、且难自定义。
新主线：
- AI 生成高质量 **2D 立绘**（可由用户照片/小说描写自定义）+ **表情差分**按对话情绪切换；后续可上 Live2D。
- **光点/粒子**做"凝形登场 + 灵气氛围"的增强（不当主角）。
- **3D 保留为可选模式**（有好模型才用）。
- ⚠️ DeepSeek 是纯文本，不能生图 → "照片→立绘/表情差分"需接**图像模型**（SD/fal/Replicate 或国内即梦/通义万相/Liblib），有成本/延迟。
- 项目已有 2D 立绘+表情地基可复用：`CharacterAssetRenderer`、表情图集、`PixelPortraitStage`。

## 已批准的总体方案（plan 文件）
`~/.claude/plans/spicy-rolling-scone.md`：**以角色为中心的沉浸陪伴 + 小说双层记忆**。
确认方向：双层记忆(本源+相处) · 沉浸气泡式对话 · 引导式「迎她入世」导入。
> 注意：plan 里"沉浸面"原按 3D 写；**结合上面的 2D 主形象决策需要相应调整**（沉浸面里放 2D 立绘而非 3D 模型为主）。

## 本会话已完成（当前可用里程碑）
- 3D 模型管线：Tripo 导出 → `gltf-transform optimize` 减面/压缩（96万→11.5万面，DPR1.5）→ 流畅。
- **真骨骼动画**（7 个片段，序号语义：0吐槽 1哭泣 2害怕 3逃跑 4警惕 5鼓掌 6跳舞）：
  - 点身体部位（调戏）→ 负面反应（头:吐槽/警惕；胸躯:害怕/哭泣/逃跑；下身:逃跑/害怕/警惕）。
  - 表情按钮（鼓掌/起舞/吐槽）→ 播对应动画（`lib/animationBus.ts` 总线 + `interactions/characterEmotes.ts` 的 `clipIndex`）。
  - **逃跑时角色转身背对**；待机随机只播跳舞；去 root-motion 让动作原地播放。
- 古风背景（`XianxiaBackdrop.tsx`：月/远山/雾/落花）+ 前景雾气 + 统一色调，让人物融入。
- 桌宠（`DesktopPet.tsx`，`?pet=1`）：透明置顶窗（`macOSPrivateApi`）、拖动手柄、随机台词气泡。
- 窗口控制（`WindowControls.tsx` 最小化/关闭）+ Tauri capabilities（拖动/最小化/关闭权限）。
- 导航精简：去掉「容相阁(AvatarStudio 编辑器)」「夺舍/像素」；model 页只剩上传（`ModelUploadPanel`）；导航名「形象」。
- 小游戏（`GamesPanel.tsx` + `lib/gamesData.ts`）：求签 + 飞花令（本地可玩）。
- 设置：DeepSeek V4 Flash/Pro 选择 + API Key 输入。
- 模型上传持久化：`lib/modelStorage.ts`（IndexedDB）。

## 本会话进行到一半（Phase 1，未接线）
新建但**尚未接入** App 的组件（因转向 2D 主形象，需重新评估去留）：
- `components/CompanionSurface.tsx`（全屏 3D 角色+气泡+输入+悬浮快捷键）
- `components/GameOverlay.tsx`（求签/飞花令浮层）
两者是独立文件、未被 import，不影响构建。**2D 转向后，CompanionSurface 里应放 2D 立绘为主**。

## 重要技术现状/坑
- **HMR 会让 3D 模型瞬间消失**：每次改 `Stage3D.tsx` 后让用户**硬刷新(Cmd+Shift+R)**。已加高度兜底（`.pca-avatar-hitbox` 固定 46vh/min320）缓解。
- **两套记忆并存**：UI 面板用 `MemorySkillStore`（memory-runtime，技能包）；`memory-core`（LLM 提取/检索 + LocalJsonMemoryStore）**已在 `CompanionRuntime` 支持但 UI 没传 `memoryStore`**（CompanionDemoApp ~1044 只传了 `memorySkillStore`）→ 双层记忆要补这个地基。
- 小说导入现用本地正则 `analyzeNovelText`（只出人格、无记忆），**没用上** `persona-core/LLMPersonaCompiler`（已写好待接）。
- 巨型文件：`packages/ui/src/CompanionDemoApp.tsx`（~3600 行，所有面板内联）。

## 建议的下一步
1. 按 2D 主形象调整沉浸面方案（立绘+表情差分+光点），先做可体验的主界面。
2. 接图像模型实现"照片/描写→立绘+表情差分"。
3. 双层记忆：在 UI 实例化 memory-core `LocalJsonMemoryStore` 传入 runtime；小说导入接 LLM 抽人格+本源记忆并 seed。
