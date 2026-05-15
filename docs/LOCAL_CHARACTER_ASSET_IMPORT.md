# Local Character Asset Import

This workflow turns messy local character images into the default product asset pack for `yuli-qingyi` / `玉璃清仪`.

## 1. Put Raw Images In The Intake Folder

Create this folder at the repository root:

```text
_asset_intake/yuli-qingyi-raw/
```

Put the raw `.png`, `.webp`, `.jpg`, or `.jpeg` files there. File names can stay messy, for example:

```text
ChatGPT Image 2026年5月10日 23_40_09 (1).png
ChatGPT Image 2026年5月10日 23_40_09 (2).png
ChatGPT Image 2026年5月10日 23_40_10 (5).png
```

Do not rename them manually. The importer copies originals into `public/assets/characters/yuli-qingyi/original/` as `source-01.png`, `source-02.png`, and records the original file names in `generated/import-report.json`.

## 2. Run The Importer

```bash
pnpm assets:import:yuli
```

The command runs:

```bash
tsx scripts/import-character-assets.ts --character yuli-qingyi --source _asset_intake/yuli-qingyi-raw
```

It creates or updates:

```text
public/assets/characters/yuli-qingyi/
  manifest.json
  original/
  stage/
  reference/
  portraits/
  thumbnails/
  generated/
    contact-sheet.png
    import-report.json
```

## 3. Automatic Mapping Rules

The importer scans all supported images, reads dimensions, file size, aspect ratio, order hints like `(1)`, and transparent-pixel signals when available.

Current default slots:

```text
stage/fullbody-front.png
stage/halfbody.png
stage/transparent-fullbody.png
reference/turnaround-sheet.png
reference/material-details.png
reference/action-states.png
portraits/avatar.png
portraits/expression-sheet.png
portraits/chat-neutral.png
portraits/chat-smile.png
portraits/chat-thinking.png
portraits/chat-confused.png
portraits/chat-shy.png
portraits/chat-annoyed.png
thumbnails/preset-card.png
```

When confidence is low, the importer still records the draft mapping with `confidence`, `reason`, and `alternates` instead of hiding uncertainty. Missing or fallback-derived assets are listed in `manifest.importInfo` and `generated/import-report.json`.

## 4. Manual Mapping Override

Manual override is optional. If auto mapping is wrong, add:

```text
_asset_intake/yuli-qingyi-raw/asset-map.json
```

Example:

```json
{
  "fullbodyFront": "ChatGPT Image 2026年5月10日 23_40_09 (1).png",
  "turnaroundSheet": "ChatGPT Image 2026年5月10日 23_40_09 (2).png",
  "avatar": "ChatGPT Image 2026年5月10日 23_40_10 (5).png",
  "expressionSheet": "ChatGPT Image 2026年5月10日 23_40_11 (7).png",
  "actionStates": "ChatGPT Image 2026年5月10日 23_40_12 (8).png",
  "materialDetails": "ChatGPT Image 2026年5月10日 23_40_12 (9).png"
}
```

Then rerun:

```bash
pnpm assets:import:yuli
```

## 5. Product Inspection

Run the web app:

```bash
pnpm dev:web
```

Open `角色资产工坊` and check `资产导入检查`. It shows the source folder, scanned count, contact sheet, mapping table, confidence values, missing assets, unused source images, suggestions, manifest preview, and rerun command.

Missing images render `MissingAssetState` instead of browser broken-image icons.

## 6. Add A Second Character

1. Add a new character config in `scripts/import-character-assets.ts`.
2. Add a package script such as:

```json
{
  "assets:import:new-character": "tsx scripts/import-character-assets.ts --character new-character --source _asset_intake/new-character-raw"
}
```

3. Register the new manifest in `packages/avatar-assets/src/DefaultCharacterAssets.ts` or load its `manifest.json` dynamically in the UI.
4. Reuse the same target folder structure under `public/assets/characters/<character-id>/`.

## 7. Avoid Broken Images

- Keep `manifest.json` paths under `/assets/characters/<character-id>/...`.
- Keep source files in the intake folder and rerun the importer after replacing art.
- Do not delete generated `stage/fullbody-front.png`; it is the required default stage image.
- Use the workshop `资产完整度检查` and `资产导入检查` panels to identify missing files.

## 8. Upgrade From Static Images To Live2D Or VRM

Static PNG assets are the default product-ready fallback. To upgrade:

1. Keep the static PNG manifest as a fallback.
2. Add licensed Live2D or VRM assets under a runtime folder such as `public/assets/characters/yuli-qingyi/runtime/`.
3. Extend `runtimeAssets` in the manifest with `live2dModelJson` or `vrm`.
4. Add a renderer branch that loads Live2D/VRM first and falls back to `CharacterAssetRenderer` if runtime loading fails.
5. Keep visual tests proving the fallback still works without paid or platform-specific assets.
