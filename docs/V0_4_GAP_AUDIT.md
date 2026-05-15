# v0.4 Gap Audit

Date: 2026-05-10

## Current Status

v0.4 is now a directly inspectable product-quality prototype. The previous raw placeholder avatar, provider-only form, missing voice path, absent visual regression suite, and incomplete desktop fallback documentation have been closed for prototype scope.

This audit is still kept as a gap document because several items remain production gaps, not prototype blockers.

## Verification

The following checks passed after the v0.4 continuation pass:

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
pnpm test:visual
```

Visual coverage currently includes:

- main web stage
- chat avatar speaking state
- memory dashboard
- personality matrix
- avatar studio
- novel import wizard
- safety mode
- settings language selector
- developer/provider panel

## Completed Prototype Gaps

- Web app launches in mock mode with a polished first-screen character stage.
- Desktop-shaped shell launches through the shared UI, with visible floating companion controls and documented Tauri limitations.
- CLI runs in mock mode with memory, persona, minor mode, traces, export, and help commands.
- The visible avatar is a manifest-driven layered 2D renderer with expression, outfit, accessory, material, memory, safety, and state-specific reactions.
- Avatar Studio exposes presets, face, features, hair, body, outfit, materials, accessories, motions, JSON import/export, default comparison, nearby randomization, and mock AI asset generation.
- Voice runtime has mock and browser-speech paths, presets, chunk preview, test flow, and avatar speaking events.
- Model provider QA performs an OpenAI-compatible `/chat/completions` test path without breaking mock mode.
- Secret storage is abstracted behind memory, browser local-development, and Tauri Stronghold adapter surfaces, with masked UI display and documented limits.
- Memory-as-Skills dashboard exposes skills, recalled packets, approval queue, CRUD, delete all, and export.
- Personality Matrix exposes multiple cores, active indicators, editing, duplication, novel import, previews, save flow, evaluator details, and minor-safe override.
- Safety Mode exposes minor-safe behavior, blocked-content testing, safe redirect results, identity role selection, and forced minor-safe core display.
- Knowledge Source UI exposes local source text, keyword retrieval, retrieved knowledge, context assembly preview, and prompt-injection warnings.
- Developer Mode exposes traces, raw matrix, memory registry, safety profile, provider settings, context isolation, evaluator output, and asset provider config.
- Visual regression tests and update commands are documented.

## Remaining Production Gaps

- Commissioned character art, Live2D/VRM rigging, licensed model assets, and production asset binding are not done.
- Real ComfyUI, Meshy, and Tripo execution still needs queue polling, cost accounting, moderation, and generated asset lifecycle management.
- Licensed voice resources and production visemes are not integrated.
- Tauri Stronghold or an OS keychain integration needs production validation.
- Signed desktop installers, updater, crash reporting, telemetry consent, privacy policy, and legal review are not done.
- Real model-provider rate limits, cost controls, streaming UX hardening, and abuse handling are not done.
- Accessibility and real user testing remain pending.

## Future Agent Notes

- Treat v0.4 as complete for local prototype inspection unless a test fails or the UI regresses.
- Do not reintroduce raw avatar placeholders into product surfaces.
- Keep normal mode consumer-facing and keep runtime internals behind Developer Mode.
- Run visual tests after UI layout, copy, avatar, or styling changes.
