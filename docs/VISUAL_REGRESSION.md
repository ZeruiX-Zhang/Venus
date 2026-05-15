# Visual Regression

v0.4 adds Playwright coverage for product inspection surfaces.

## Functional E2E

```bash
pnpm test:e2e
```

Covers:

- First-screen product shell.
- Chat and memory approval queue.
- Memory dashboard.
- Novel import analysis.
- Minor-mode safety test.
- Voice test flow.
- Developer Mode provider QA.

## Screenshot Tests

```bash
pnpm test:visual
```

Screenshot surfaces:

- Main web stage.
- Chat with avatar response.
- Memory dashboard.
- Personality Matrix.
- Novel Import Wizard.
- Safety Mode.
- Model Provider Panel.

## Updating Baselines

Screenshots are environment-specific. Update intentionally:

```bash
pnpm test:visual:update
```

Review generated images before committing them. Do not update baselines to hide layout regressions, text overlap, blank avatar states, or missing product controls.
