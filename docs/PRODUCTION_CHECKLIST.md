# Production Checklist

## Ready In v0.3

- Mock-mode web app.
- Desktop-shaped shell.
- CLI pixel companion.
- Shared deterministic runtime.
- Memory-as-Skills registry with selection, recall, approval, export, delete.
- Personality Matrix with multiple persona cores and novel import.
- Minor-safe mode and identity boundaries.
- Developer Mode traces and raw runtime panels.
- Typecheck coverage across the workspace.

## Not Production-Ready

- OS keychain or Tauri secure storage.
- Signed desktop installers.
- Auto-updater.
- Crash reporting.
- Privacy policy.
- Legal review for imported fiction, character likeness, data retention, and voice.
- Licensed final character art.
- Voice provider licensing, TTS, and viseme integration.
- Real model-provider test matrix.
- Rate limits, cost controls, and abuse monitoring.
- Encrypted memory vault.
- Production vector store and embeddings.
- Large document ingestion pipeline.
- Desktop transparent always-on-top QA across Windows/macOS/Linux.

## Release Gates

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- Manual web inspection.
- Manual CLI smoke test.
- Manual desktop shell smoke test.
- Minor-mode redirection test.
- Memory export/delete test.
- Developer-mode hiding test.
