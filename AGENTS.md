# AGENTS.md

## Project Purpose

Personal Character Agent is a TypeScript-first premium local product for an anime-style personal companion across web, desktop, and CLI. v0.4 targets a directly inspectable product-quality prototype: a polished character stage, real mockable chat and voice paths, Memory-as-Skills, Personality Matrix, minor-safe mode, explicit identity boundaries, desktop floating companion behavior, secure model-provider key handling, diagnostics, and visual regression coverage.

UI quality is part of the product contract. The app should feel like a premium personal character agent, virtual desktop pet, and AI VTuber stage system, not an engineering skeleton.

## Setup Commands

```bash
pnpm install
```

Windows fallback:

```bash
node .corepack\v1\pnpm\9.15.4\bin\pnpm.cjs install
```

## Run Commands

```bash
pnpm dev:web
pnpm dev:desktop
pnpm dev:desktop:tauri
pnpm dev:cli
```

`dev:desktop` runs the desktop-shaped React shell in a browser. `dev:desktop:tauri` runs the native wrapper when Rust/Tauri prerequisites are installed.

## Test Commands

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

## Code Style

- TypeScript-first, strict mode, explicit domain types.
- Prefer deterministic workflows over hidden LLM behavior.
- Use existing package boundaries before adding new abstractions.
- Keep UI controls accessible, compact, and product-shaped.
- No raw placeholder boxes, unstyled debug forms, or visually unfinished panels in product surfaces.
- If real art, Live2D/VRM, or paid voice assets are absent, provide a polished procedural fallback with a clear upgrade path.
- Store derived novel traits and constraints, not long copyrighted passages.
- Default memory write mode is ask-before-saving.

## Architecture Overview

- `apps/web`: web companion stage.
- `apps/desktop`: Tauri/Vite desktop companion shell.
- `apps/cli`: pixel companion using the shared runtime.
- `packages/agent-runtime`: v0.3 orchestration workflow.
- `packages/memory-runtime`: Memory Skill Registry, read/write pipelines, stores.
- `packages/persona-runtime`: Personality Matrix, persona selection, novel import, evaluator.
- `packages/safety-runtime`: safety profiles, minor mode, identity policies.
- `packages/avatar-runtime`: avatar state machine and CLI pixel renderer.
- `packages/model-gateway`: mock and OpenAI-compatible gateway plus secret-store interfaces.
- `packages/ui`: shared React product UI for web and desktop.
- Existing `*-core` packages remain for compatibility and lower-level utilities.

## Safety Rules

- Minor mode blocks sexual content, pornographic content, erotic roleplay, graphic violence, gore, and adult romantic escalation.
- Safety and identity policies override persona cores.
- Normal mode must hide developer complexity, runtime traces, raw provider details, raw persona JSON, prompt assembly, and memory debug packets.
- Developer mode must expose runtime internals: traces, raw persona cores, recalled memory packets, memory-skill reasoning, safety profiles, provider settings, context isolation, and evaluator output.
- Never silently save sensitive personal details.

## Repository Boundary

Only modify files inside this repository folder. Do not write project artifacts outside the repo. Do not run destructive system commands.

## Implementation Checklist

- Web app launches in mock mode.
- Desktop app launches as a desktop-shaped shell or documents platform limitation.
- CLI runs in mock mode.
- Character stage is visually polished and avatar changes state during chat.
- Memory dashboard lists skills, recalled packets, approval queue, CRUD, delete all, and export.
- Personality Matrix lists multiple cores, active indicators, novel import, previews, and save flow.
- Minor mode visibly changes behavior and forces safe redirects.
- Developer mode shows traces, raw matrix, memory registry, safety profile, provider settings, and evaluator output.
- All features must have visible UI paths; do not leave package-only behavior without an interface.
- Desktop-specific behavior must include visible floating companion controls or a documented platform limitation.
- Model provider configuration must be testable from Developer Mode without breaking mock mode.
- Tests cover memory, persona, safety, avatar, gateway, and agent workflow.

## Definition Of Done

- `pnpm typecheck` passes.
- `pnpm test` passes or any environment limitation is documented.
- `pnpm lint` passes or any environment limitation is documented.
- `pnpm build` is attempted and failures are fixed or clearly explained.
- Visual regression tests exist for the primary product surfaces and can be updated with a documented command.
- README and docs describe run/test/build, mock mode, developer mode, safety, memory, and production gaps.
- Normal user UI remains understandable without developer settings.

## Visual Inspection Checklist

Before finishing UI work, manually inspect:

- First screen shows a polished character stage, chat entry, quick action cards, character status, provider mode, and minor-mode indicator.
- Avatar is not a raw CSS placeholder and visibly reacts to typing, sending, thinking, speaking, memory recall, safety blocks, and idle state.
- Normal mode reads as a consumer product and hides raw internals.
- Developer Mode exposes traces, context assembly, provider testing, memory reasoning, safety profile, and evaluator details.
- Memory, Persona Matrix, Novel Import, Safety Mode, Model Provider, Voice, and Desktop controls all have visible end-to-end UI paths.
- Empty and fallback states are intentionally designed and explain what the user can do next.
- Responsive layouts work at phone, tablet, laptop, and wide desktop widths.
- No text overlaps controls; long labels wrap or truncate cleanly.
- Color, spacing, typography, and transitions are coherent across web and desktop.

## Instructions For Future Coding Agents

1. Inspect the codebase before editing.
2. Keep changes inside this repository.
3. Preserve working web, desktop, and CLI entry points.
4. Prefer `pnpm` commands and existing workspace packages.
5. Add tests near the runtime behavior being changed.
6. Keep Memory-as-Skills selective; do not turn memory into one generic prompt blob.
7. Keep persona cores isolated from external knowledge.
8. Keep minor-safe mode and developer-mode hiding tests green.
9. Treat UI quality as part of Definition of Done; no raw placeholder boxes.
10. Run `pnpm typecheck`, `pnpm test`, `pnpm lint`, and `pnpm build` before finishing, and run visual tests when feasible.
