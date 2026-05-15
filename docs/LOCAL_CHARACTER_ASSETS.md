# Local Character Assets

The default character is asset-pack driven. The product should render local character images first, show a clear missing-asset state when a file is absent, and use the procedural avatar only as the final low-fidelity fallback when no manifest/image path exists.

## Directory Structure

Place browser-served images under `public/assets/characters/<character-id>/`.

```text
public/assets/characters/yuli-qingyi/
  manifest.json
  stage/
    fullbody-front.png
    halfbody.png
    bust.png
  portraits/
    avatar.png
    neutral.png
    smile.png
    thinking.png
    confused.png
    shy.png
    annoyed.png
  thumbnails/
    preset-card.png
  reference/
    turnaround-sheet.png
    front.png
    side.png
    back.png
    three-quarter.png
```

Runtime URLs omit `public`:

```text
/assets/characters/yuli-qingyi/stage/fullbody-front.png
```

Do not import these files from TypeScript. Keep them as public root-path URLs.

## Yuli Qingyi

`yuli-qingyi` / `玉璃清仪` is the bundled first default character. The canonical manifest lives in:

```text
packages/avatar-assets/src/DefaultCharacterAssets.ts
public/assets/characters/yuli-qingyi/manifest.json
```

The manifest uses nested assets:

```json
{
  "id": "yuli-qingyi",
  "displayName": "玉璃清仪",
  "assets": {
    "stage": {
      "fullbodyFront": "stage/fullbody-front.png",
      "halfbody": "stage/halfbody.png"
    },
    "portraits": {
      "avatar": "portraits/avatar.png"
    },
    "thumbnails": {
      "presetCard": "thumbnails/preset-card.png"
    },
    "reference": {
      "turnaroundSheet": "reference/turnaround-sheet.png"
    }
  }
}
```

## Image Purposes

- `stage/fullbody-front.png`: required default homepage stage image.
- `stage/halfbody.png`: preferred chat and desktop compact companion image.
- `stage/bust.png`: optional tight desktop or voice panel crop.
- `portraits/avatar.png`: chat avatar and identity marker.
- `portraits/neutral.png`: default expression portrait.
- `portraits/smile.png`: happy/speaking expression.
- `portraits/thinking.png`: thinking/listening expression.
- `portraits/confused.png`: safety redirect or confusion expression.
- `portraits/shy.png`: peeking/shy expression.
- `portraits/annoyed.png`: annoyed/error expression.
- `thumbnails/preset-card.png`: Character Workshop preset card.
- `reference/turnaround-sheet.png`: four-view design sheet.
- `reference/front.png`, `side.png`, `back.png`, `three-quarter.png`: optional separate four-view images.

## Formats And Sizes

Recommended formats:

- Prefer `.webp` for optimized production assets.
- Keep `.png` paths in the manifest for stable authoring.
- If both `.webp` and `.png` exist, the loader tries `.webp` first.
- If neither exists, it tries `.jpg` and `.jpeg`.

Recommended dimensions:

- Full body: at least 1536px high.
- Half body: at least 1200px high.
- Bust: at least 1024px high.
- Avatar and expressions: 1024x1024.
- Preset card: 4:5 or 1024x1400.
- Turnaround/reference sheet: at least 2048px wide.

Transparent backgrounds are best. Light neutral backgrounds are acceptable for reference sheets. Do not bake UI frames, watermarks, captions, or decorative borders into character images.

## Add A Second Default Character

1. Create a new folder:

```text
public/assets/characters/<new-id>/
```

2. Add the same `stage`, `portraits`, `thumbnails`, and `reference` folders.
3. Add a manifest object in `packages/avatar-assets/src/DefaultCharacterAssets.ts`.
4. Register it in `defaultCharacterManifests`.
5. If it should become the app default, update `DEFAULT_CHARACTER_ASSET_ID` and the initial `characterAssetManifest` in `CompanionDemoApp`.
6. Add import slots and completeness items for the new character.
7. Add or update tests so the homepage renders that character through `CharacterAssetRenderer`.

Do not claim open-source or commercial rights in `credits` unless the user provides that license. Use:

```json
{
  "source": "user-provided-local-asset",
  "license": "user-owned-or-authorized"
}
```

## Debug Missing Images

Missing images render `MissingAssetState`, not broken browser image icons.

Check:

- The file is under `public/assets/characters/<id>/...`.
- The runtime URL starts with `/assets/characters/<id>/...`.
- The manifest path is relative to the character root.
- The filename uses the exact expected spelling, such as `fullbody-front.png`.
- If using WebP, place `fullbody-front.webp` next to the PNG path. WebP is preferred automatically.

The Character Workshop shows an asset completeness panel with found, missing, and pending slots.

## Upgrade Path To Live2D Or VRM

Static images are the default route for v0.4. The manifest already reserves:

```json
{
  "runtimeAssets": {
    "vrm": "runtime/yuli-qingyi.vrm",
    "live2dModelJson": "runtime/live2d/model.json",
    "layeredPsd": "source/yuli-qingyi-layered.psd"
  }
}
```

Upgrade steps:

1. Keep static images as fallback and store the rigged model under `runtime/`.
2. Add a renderer adapter that prefers `runtimeAssets.vrm` or `runtimeAssets.live2dModelJson` only when the model exists and loads.
3. Preserve `MissingAssetState` for model-load failures.
4. Keep minor-safe and developer-mode rules independent from the visual renderer.
5. Add visual tests for model loaded, model missing, and static fallback paths.
