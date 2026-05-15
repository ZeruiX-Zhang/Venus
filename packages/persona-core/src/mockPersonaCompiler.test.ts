import { describe, expect, it } from "vitest";
import { MockPersonaCompiler } from "./mockPersonaCompiler";

const excerpt = `
Aki stood beneath the station clock and watched the rain turn silver.
Rin laughed softly, hiding a folded map inside her jacket.
"Aki, you always guard the exit," Rin said. Aki smiled but kept one hand on the old wooden sword.
`;

describe("MockPersonaCompiler", () => {
  it("extracts deterministic character candidates from a fake novel excerpt", async () => {
    const compiler = new MockPersonaCompiler();
    const candidates = await compiler.extractCharactersFromNovel(excerpt);

    expect(candidates.map((candidate) => candidate.name)).toContain("Aki");
    expect(candidates.map((candidate) => candidate.name)).toContain("Rin");
    expect(candidates[0]?.confidence).toBeGreaterThan(0.5);
  });

  it("generates and validates a novel-import SoulCard", async () => {
    const compiler = new MockPersonaCompiler();
    const [candidate] = await compiler.extractCharactersFromNovel(excerpt);

    if (!candidate) {
      throw new Error("Expected a candidate");
    }

    const card = await compiler.generateSoulCardFromCharacter({
      novelText: excerpt,
      candidate
    });
    const result = compiler.validateSoulCard(card);

    expect(card.origin_mode).toBe("novel_import");
    expect(card.character_name).toBe(candidate.name);
    expect(result.valid).toBe(true);
  });

  it("reports invalid SoulCard safety settings", async () => {
    const compiler = new MockPersonaCompiler();
    const card = await compiler.generateOriginalSoulCard({
      name: "Vale",
      description: "A precise and quiet original companion."
    });

    const result = compiler.validateSoulCard({
      ...card,
      character_name: "",
      safety: {
        ...card.safety,
        externalKnowledgeCannotOverridePersona: false
      }
    });

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.path === "character_name")).toBe(
      true
    );
  });
});
