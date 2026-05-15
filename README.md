# Personal Character Agent

Premium local v0.4 prototype for an anime-style Personal Character Agent across web, desktop, and CLI.

The default runtime is `mock`, so the product can be opened and inspected without API keys. The same `CompanionRuntime` powers the web app, desktop-shaped shell, Tauri wrapper, and CLI pixel companion.

The default interface language is Chinese. Open `设置` / `Settings` to switch between Chinese and English; the choice is stored locally for the next launch. The setting is also passed into runtime replies, mock generation, novel import, and newly created persona cores. Memory Skill IDs, names, and namespaces intentionally remain English because translating them would change stable internal semantics.

## Install

```bash
pnpm install
```

Windows fallback:

```bash
node .corepack\v1\pnpm\9.15.4\bin\pnpm.cjs install
```

## Run

```bash
pnpm dev:web
pnpm dev:desktop
pnpm dev:desktop:tauri
pnpm dev:cli
```

`dev:web` opens the browser product. `dev:desktop` opens the desktop-shaped Vite shell. `dev:desktop:tauri` runs the native wrapper when local Rust/Tauri prerequisites are installed. `dev:cli` launches the pixel companion.

## Import Local Default Character Assets

The default character is `yuli-qingyi` / `玉璃清仪`. Put messy raw `.png`, `.webp`, `.jpg`, or `.jpeg` files under:

```text
_asset_intake/yuli-qingyi-raw/
```

Then run:

```bash
pnpm assets:import:yuli
```

The importer keeps originals, generates normalized product assets, writes `public/assets/characters/yuli-qingyi/manifest.json`, creates `generated/contact-sheet.png`, and records all mappings in `generated/import-report.json`. The main stage uses `stage/fullbody-front.png`, chat uses `portraits/avatar.png`, and missing files show `MissingAssetState` instead of browser broken-image icons.

See [docs/LOCAL_CHARACTER_ASSET_IMPORT.md](docs/LOCAL_CHARACTER_ASSET_IMPORT.md) for the full import workflow, auto mapping rules, optional `asset-map.json`, target directory structure, and Live2D/VRM upgrade path. See [docs/LOCAL_CHARACTER_ASSETS.md](docs/LOCAL_CHARACTER_ASSETS.md) for the lower-level manifest shape.

## Test And Build

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
pnpm test:visual
pnpm test:visual:update
```

Visual screenshots are environment-specific. Run `pnpm test:visual:update` intentionally when accepting new baselines, then `pnpm test:visual` to compare.

## What Is Inspectable In v0.4

- Premium dark glass UI with a first-screen character stage, chat entry, quick action cards, status, provider mode, and minor-mode indicator.
- Chinese/English interface language setting, with Chinese as the default normal-user UI.
- Chinese/English content-language support for mock replies, Personality Matrix cores, Novel Import generation, Memory write prompts, and Chinese safety/memory triggers.
- Local Character Asset Pack system for the default character `yuli-qingyi` / `玉璃清仪`, with automatic intake import, `public/assets/characters/yuli-qingyi/manifest.json`, shared asset resolution, PNG/WebP/JPG/JPEG candidates, and designed missing-asset import states.
- Character Asset Workshop / 角色资产工坊 with the default character card, local asset gallery, full-body / half-body / avatar / portrait switching, reference views, expression/action/material previews, `资产导入检查`, contact-sheet display, import-report summary, import instructions, and Developer Mode manifest JSON.
- Asset-first character renderer with contain-fit transparent PNG/WebP support, restrained backlight, breathing/floating/speaking/memory/safety state effects, and procedural avatar fallback only when no local asset manifest or image path is available.
- Mock chat with immediate avatar reactions, memory recall indicator, safety redirects, persona selection, traces, and voice directives.
- Memory-as-Skills dashboard with seeded demo memories, enabled/disabled skills, always-on blocks, recall reasons, approval queue, CRUD, delete all, and export.
- Personality Matrix with base, novel, user-created, reality-based, scene, and minor-safe cores; active state; editing; duplication; constraints; context isolation; and evaluator rules in Developer Mode.
- Novel Import Wizard with sample excerpt, analysis, multiple candidate cores, generated constraints, evaluator previews, and save flow.
- Safety Mode panel with minor mode toggle, blocked-content test input, safe redirection result, identity role selector, and forced `minor_safe_core` display.
- Knowledge Source panel with local source text, keyword retrieval, retrieved knowledge display, context assembly preview, and prompt-injection warnings.
- Voice runtime with preset selection, mock TTS, browser speech fallback, chunk preview, pitch/rate controls, test voice button, and mouth-sync events.
- Developer Mode with traces, raw matrix, memory registry, safety profile, context assembly, audit entries, and model provider QA.
- Developer Mode AI asset configuration for MockAssetProvider, ComfyUI, Meshy, and Tripo adapter settings.
- Model provider QA panel with OpenAI-compatible `/chat/completions` test request, latency, status, model name, capability flags, masked key storage, and mock-safe behavior.
- Desktop floating companion controls for compact mode, always-on-top intent, opacity, lock/peek, reset, and Tauri fallback explanation.
- CLI pixel companion with memory, persona, minor mode, developer traces, export, and help commands.

## Mock Mode

Mock mode is default and requires no key. It uses deterministic local responses, Memory-as-Skills recall, persona selection, safety checks, avatar events, trace creation, and mock voice sync.

## Developer Mode

Normal mode hides raw internals. Developer Mode reveals provider settings, traces, recalled memory packets, raw persona cores, evaluator details, safety profile JSON, context assembly, and model provider test results.

## Model Provider Setup

1. Enable Developer Mode.
2. Open Provider.
3. Switch mode from `mock` to `local` or `cloud`.
4. Enter provider name, base URL, model, and API key.
5. Save the key, then click `Test Provider`.

Provider requests use OpenAI-compatible `POST /chat/completions`. If no key is saved, mock mode remains usable and the provider test reports a recoverable missing-key result.

## Secure Key Storage Limits

The model gateway now has a `SecretStore` abstraction with in-memory, browser local-development, and Tauri Stronghold adapter surfaces. Browser storage masks keys in the UI but is not equivalent to an OS keychain. Tauri Stronghold is represented as an integration adapter and must be wired to `tauri-plugin-stronghold` before production.

## Desktop Notes

Tauri config now attempts transparent, decoration-free desktop behavior and exposes native commands for always-on-top, decorations, opacity, and position reset. Click-through is not enabled because support is platform-specific and easy to misuse. The safe fallback is compact floating mode, opacity control, lock/unlock, hide/peek, and reset position.

## Runtime Packages

- `packages/agent-runtime`: deterministic workflow, traces, safety, memory, persona, provider gateway, and context isolation.
- `packages/memory-runtime`: Memory-as-Skills registry and read/write pipelines.
- `packages/persona-runtime`: Personality Matrix, evaluator, and novel import.
- `packages/safety-runtime`: minor mode, identity policy, permissions, and audit primitives.
- `packages/avatar-assets`: local character asset manifest types, validation, path resolution, registry, default `yuli-qingyi` manifest, and asset-first React renderer.
- `packages/avatar-model`: AvatarManifest, body/face/outfit/accessory schemas, material slots, validation, JSON import/export, and six default guofeng presets.
- `packages/avatar-runtime`: avatar state machine, layered 2D React renderer, legacy procedural avatar, themes, motions, adapters, and CLI renderer.
- `packages/asset-generation`: provider interface, MockAssetProvider, and future ComfyUI/Meshy/Tripo adapters for concept, turnaround, texture, and 3D draft jobs.
- `packages/voice-runtime`: mock/browser TTS pipeline, presets, chunking, events, and mouth-sync approximation.
- `packages/model-gateway`: mock and OpenAI-compatible provider gateway plus secret-store implementations.
- `packages/ui`: shared React product shell and panels.

## Not Production-Ready Yet

- Final imported `玉璃清仪` production art files for every slot in `public/assets/characters/yuli-qingyi/`.
- Live2D/VRM rigging and licensed model assets.
- Production GLB/VRM/Live2D asset binding for every AvatarManifest slot.
- Real ComfyUI/Meshy/Tripo API execution, queue polling, cost accounting, and generated asset moderation.
- Licensed voice resources and production visemes.
- Tauri Stronghold or OS keychain integration validation.
- Signed desktop installers and updater.
- Privacy policy and legal review.
- Real model provider cost controls and rate limits.
- Production telemetry, crash reporting, and consent flow.
- Real user testing and accessibility audit.
