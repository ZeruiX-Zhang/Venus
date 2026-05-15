# Avatar System Audit

## 2026-05 Local Asset Pack Update

默认角色已经从程序化 CSS/DOM 角色切换为 Local Character Asset Pack System。`packages/avatar-assets` 定义 `CharacterAssetManifest`、manifest 校验、路径解析、默认 `yuli-qingyi` 注册表和资产优先 React renderer。Web 与 desktop Vite shell 共享仓库根目录 `public`，因此 `public/assets/characters/yuli-qingyi/manifest.json` 及同目录图片放入后会直接被首页舞台、聊天头像、角色资产工坊和桌面小窗读取。

程序化 layered/procedural avatar 仍保留为 fallback，但默认 `玉璃清仪` manifest 缺图时会显示导入提示，不再把几何角色叠到默认角色位置。具体资产文件名和推荐尺寸见 `docs/LOCAL_CHARACTER_ASSETS.md`。

## 1. 当前人物系统为什么无法接近高质量参考图

当前人物系统以固定 React DOM 结构和 CSS 变量为核心：舞台角色由少量固定层绘制，外观页只改变主题、发型/脸型等文本字段和几个颜色变量。它不是资产驱动的角色系统，也没有可交换部件、材质槽、身体比例、服装层级、配饰槽位或生成资产导入流程。

高质量古风多角度角色参考图的关键不是单一提示词，而是稳定的角色结构：脸型、五官、发髻、发饰、内衫、外袍、宽袖、披帛、裙摆、腰带、鞋、刺绣和舞台光效之间存在明确层级。当前实现只有固定小人轮廓，不能表达复杂汉服结构，也不能把参考图中的角色设计拆成可编辑、可复用、可验收的资产数据。

## 2. 当前程序化角色的限制

- 角色结构固定：头、脸、头发、服装和配饰没有独立 schema，无法按部位替换。
- 材质表达不足：每个部件没有独立 silk、gauze、jade、gold、embroidered 等材质参数，只能靠主题色近似。
- 身材和脸型不可建模：身高、头身比、肩宽、腰身、下巴、脸颊、眼型等不能作为正式数据保存。
- 服装不是服装系统：内衫、外袍、宽袖、披帛、裙摆、腰带、鞋子、刺绣没有可配置槽位。
- 配饰不是槽位：发簪、耳饰、流苏、玉佩、发带等不能单独开启、调色、调材质或排序。
- 外观页不可验收：现有 UI 更像调试表单，用户无法像游戏角色编辑器一样直观看到每个部位的编辑结果。

## 3. 为什么需要 Avatar Manifest

Avatar Manifest 是角色外观的可移植契约。它把角色从“某个组件的内部 CSS 状态”提升为产品级数据模型，保存 renderer、style、身体、脸型、五官、发型、服装、配饰、材质槽、动作表情和资产来源。

有了 Manifest，Web、Desktop、CLI、未来 Live2D/VRM/GLB renderer 和 AI 资产生成器可以读取同一份角色定义。用户导出、导入、复制、保存预设和比较默认模型也有稳定数据载体，而不是依赖一组临时 UI 字段。

## 4. 为什么需要身体部件和材质槽位

角色编辑器必须把“部件”和“材质”分离。部件决定形状和语义，例如披帛、宽袖、外袍、发簪；材质槽决定显示属性，例如主色、副色、透明度、丝绸、纱、玉、金属度、粗糙度、纹理、遮罩和 zIndex。

这种设计允许同一件外袍套用不同材质，也允许同一材质批量复用到不同部件。它还能让用户单独调整皮肤、头发、眼睛、内衫、外袍、宽袖、披帛、腰带、裙摆、鞋子、发簪、耳饰、刺绣和背景光，而不是只切换整套主题色。

## 5. 为什么 AI 生成图不等于可动模型

AI 生成图通常是平面图像。它可以作为概念图、设定图、多角度参考或贴图草稿，但它没有骨骼、网格、blendshape、Live2D 参数、VRM humanoid rig、布料层级或可交互材质槽。

如果直接把生成图当作模型，角色无法稳定眨眼、说话、转头、换装、坐在边缘、探头或在桌面悬浮。正确流程是先生成候选资产，进入预览，再由用户确认导入为 Manifest 预设；之后由 layered-2d、Live2D、VRM 或 GLB renderer 根据 Manifest 映射到可动结构。

## 6. 新方案如何支持未来 Live2D / VRM / GLB / AI 3D API

新方案以 Avatar Manifest 为中心：

- layered-2d：当前可用的高质量分层 2D renderer，直接读取 Manifest 的部件、比例和材质槽。
- Live2D：未来可把 Manifest 的 face、hair、outfit、accessories 和 motions 映射到 Cubism 参数、部件显隐、材质贴图和表情状态。
- VRM：未来可把 body shape、face shape、material slots 和 motions 映射到 VRM humanoid、blendshape、materials 和 animation clips。
- GLB：未来可把每个 AvatarPart 绑定到 mesh/material/node，按 Manifest 控制颜色、贴图、透明度和 zIndex。
- AI 3D API：ComfyUI 负责概念图、多角度图和贴图变体；Meshy/Tripo 负责 image-to-3D、text-to-3D 或 multi-image-to-3D 草稿。生成结果不会直接覆盖当前角色，必须先进入预览，再由用户导入为新预设。

本次实现的目标不是凭空生成商业级资产，而是把系统重构成资产驱动、部件驱动、可扩展、可 UI 验收的角色工坊基础。
