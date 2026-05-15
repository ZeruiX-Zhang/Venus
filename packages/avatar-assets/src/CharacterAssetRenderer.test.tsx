import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { yuliQingyiManifest } from "./DefaultCharacterAssets";
import { CharacterAssetRenderer } from "./CharacterAssetRenderer";

describe("CharacterAssetRenderer", () => {
  it("renders the default character through a local asset image", () => {
    const html = renderToString(
      <CharacterAssetRenderer manifest={yuliQingyiManifest} state="idle" view="fullbody" />
    );

    expect(html).toContain('data-render-source="local-asset"');
    expect(html).toContain("fullbody-front.png");
    expect(html).not.toContain("pca-layered-avatar");
  });

  it("renders procedural fallback only when no local asset manifest exists", () => {
    const html = renderToString(
      <CharacterAssetRenderer manifest={undefined} state="idle" view="fullbody" />
    );

    expect(html).toContain('data-render-source="procedural-fallback"');
    expect(html).toContain("pca-layered-avatar");
    expect(html).toContain("低保真 fallback");
  });

  it("can render an import prompt instead of procedural fallback", () => {
    const html = renderToString(
      <CharacterAssetRenderer
        allowProceduralFallback={false}
        manifest={undefined}
        state="idle"
        view="fullbody"
      />
    );

    expect(html).toContain('data-render-source="pending-local-asset"');
    expect(html).toContain("缺少角色资产");
  });

  it("can render the chat text fallback when all avatar assets are missing", () => {
    const html = renderToString(
      <CharacterAssetRenderer
        allowProceduralFallback={false}
        manifest={undefined}
        state="idle"
        textFallback="玉"
        view="avatar"
        size="small"
      />
    );

    expect(html).toContain('data-render-source="text-fallback"');
    expect(html).toContain(">玉<");
  });
});
