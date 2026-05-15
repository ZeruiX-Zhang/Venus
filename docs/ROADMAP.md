# Roadmap

## Phase 0: Runnable MVP Skeleton

- TypeScript pnpm monorepo.
- Shared domain models.
- Mock persona compiler.
- Mock model client and OpenAI-compatible provider abstraction.
- Memory CRUD with privacy export/delete APIs.
- Avatar event bus, state machine, placeholder 2D/3D, and CLI pixel renderer.
- Web, desktop shell, and CLI demos.
- Tests for persona, memory, avatar, and agent runtime.

## Phase 1: Real Integrations

- Provider presets for OpenAI-compatible, local, and hosted model APIs.
- IndexedDB and desktop file-backed memory adapters.
- Optional vector-memory/RAG package with strict instruction isolation.
- Live2D or VRM runtime adapter.
- Browser TTS prototype and voice event hooks.
- Character import review workflow with editable evidence.

## Phase 2: Product Hardening

- Signed Tauri builds and updater.
- Encrypted memory vault.
- Permission prompts and persistent audit log.
- Account sync and multi-device character library.
- Voice licensing workflow.
- Legal review for imported fiction, reality-based personas, privacy, and data retention.
- Production observability and crash reporting.
