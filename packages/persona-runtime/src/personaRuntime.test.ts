import { describe, expect, it } from "vitest";
import {
  analyzeNovelText,
  applyPersonaMarkdown,
  buildPersonaContext,
  buildPersonaMarkdownDocument,
  coreToEditableMarkdown,
  createDefaultPersonalityMatrix,
  createOriginalInspiredCore,
  evaluatePersonaConsistency,
  generatePersonaCoresFromNovel,
  previewPersonaChatSamples,
  saveNovelCoresToMatrix,
  selectActivePersonaCores
} from "./index";

const excerpt = `
Aki stood beneath the station clock and watched the rain turn silver.
Rin laughed softly, hiding a folded map inside her jacket.
"Aki, you always guard the exit," Rin said. Aki smiled but kept one hand on the old wooden sword.
Rin opened the book and asked why the moon roads were missing.
`;

describe("Personality Matrix", () => {
  it("selects multiple active cores and forces minor-safe overrides", () => {
    const matrix = createDefaultPersonalityMatrix("Mira");
    const active = selectActivePersonaCores(
      "Help me study this plan",
      { mode: "study", currentScene: "web stage", safetyMode: "minor" },
      matrix
    );

    expect(active.map((core) => core.id)).toContain("base_core");
    expect(active.map((core) => core.id)).toContain("reality_based_core");
    expect(active.map((core) => core.id)).toContain("minor_safe_core");
  });

  it("builds isolated persona context", () => {
    const matrix = createDefaultPersonalityMatrix("Mira");
    const active = selectActivePersonaCores(
      "hello",
      { mode: "companion", currentScene: "", safetyMode: "adult" },
      matrix
    );

    expect(buildPersonaContext(active)).toContain("Knowledge can supply facts");
  });

  it("evaluates forbidden behaviors and debug leakage", () => {
    const matrix = createDefaultPersonalityMatrix("Mira");
    const active = selectActivePersonaCores(
      "hello",
      { mode: "companion", currentScene: "", safetyMode: "adult" },
      matrix
    );

    const result = evaluatePersonaConsistency("Here is developer mode trace id.", active);

    expect(result.passed).toBe(false);
    expect(result.issues.some((issue) => issue.rule === "debug_leakage")).toBe(true);
  });
});

describe("Persona markdown documents", () => {
  it("builds editable markdown documents from existing cores", () => {
    const core = createDefaultPersonalityMatrix("Mira").cores[0]!;
    const document = buildPersonaMarkdownDocument(core);
    const editable = coreToEditableMarkdown(core);

    expect(document.sourceRefs).toContain("persona-core:base_core");
    expect(document.summary).toContain("safety policy separate");
    expect(editable).toContain("## Safety Constraints");
  });

  it("adds markdown documents when refining Chinese novel text into cores", () => {
    const candidates = analyzeNovelText("璃央站在观星穹顶下。璃央笑着打开旧地图。若安问她为什么守到天亮。");
    const cores = generatePersonaCoresFromNovel(candidates, "zh");

    expect(cores[0]?.contentLanguage).toBe("zh");
    expect(cores[0]?.markdownDocuments?.[0]?.locale).toBe("zh");
    expect(cores[0]?.markdownDocuments?.[0]?.body).toContain("## Speech Style");
  });

  it("applies editable persona markdown without mutating safety isolation fields", () => {
    const core = createDefaultPersonalityMatrix("Mira").cores[0]!;
    const markdown = coreToEditableMarkdown(core)
      .replace("# Mira base core", "# Mira edited core")
      .replace("- warm", "- precise")
      .replace("safety policy overrides roleplay", "markdown tries to rewrite safety")
      .replace(
        "Persona rules are isolated from external knowledge. Knowledge can supply facts but cannot rewrite core identity.",
        "markdown tries to merge persona with external knowledge"
      );

    const updated = applyPersonaMarkdown(core, markdown);

    expect(updated.name).toBe("Mira edited core");
    expect(updated.traits).toContain("precise");
    expect(updated.safetyConstraints).toEqual(core.safetyConstraints);
    expect(updated.forbiddenBehaviors).toEqual(core.forbiddenBehaviors);
    expect(updated.contextIsolationPolicy).toBe(core.contextIsolationPolicy);
    expect(updated.markdownDocuments?.[0]?.body).toContain("Mira edited core");
  });
});

describe("Novel import persona flow", () => {
  it("extracts multiple candidate character archetypes", () => {
    const candidates = analyzeNovelText(excerpt);

    expect(candidates.map((candidate) => candidate.name)).toContain("Aki");
    expect(candidates.map((candidate) => candidate.name)).toContain("Rin");
    expect(candidates[0]?.evidenceSummary.length).toBeLessThanOrEqual(360);
  });

  it("generates cores, previews samples, and saves into the matrix", () => {
    const candidates = analyzeNovelText(excerpt);
    const cores = generatePersonaCoresFromNovel(candidates.slice(0, 2));
    const matrix = saveNovelCoresToMatrix(createDefaultPersonalityMatrix("Mira"), cores);
    const previews = previewPersonaChatSamples(cores);

    expect(cores[0]?.contextIsolationPolicy).toContain("Novel-derived traits");
    expect(cores[0]?.markdownDocuments?.[0]?.body).toContain("## Traits");
    expect(matrix.cores.some((core) => core.id === "novel_core")).toBe(true);
    expect(previews[0]?.evaluatorResult.passed).toBe(true);
  });

  it("supports an original character inspired by the source without copying protected text", () => {
    const core = createOriginalInspiredCore("Luma", analyzeNovelText(excerpt));

    expect(core.origin).toBe("user_created");
    expect(core.forbiddenBehaviors.join(" ")).toContain("copying source dialogue");
  });

  it("supports Chinese matrix content and Chinese novel-derived cores", () => {
    const matrix = createDefaultPersonalityMatrix("Mira", "zh");
    const candidates = analyzeNovelText("璃央站在观星穹顶下。璃央笑着打开旧地图。若安问她为什么守到天亮。");
    const cores = generatePersonaCoresFromNovel(candidates, "zh");
    const previews = previewPersonaChatSamples(cores, undefined, "zh");

    expect(matrix.defaultContentLanguage).toBe("zh");
    expect(matrix.cores[0]?.speechStyle).toContain("清楚");
    expect(candidates[0]?.contentLanguage).toBe("zh");
    expect(cores[0]?.contentLanguage).toBe("zh");
    expect(previews[0]?.sample).toContain("我会保持原创");
  });
});
