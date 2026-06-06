import { describe, expect, it } from "vitest";
import { LLMPersonaCompiler } from "./llmPersonaCompiler";

// 模拟 ModelClient，根据 system prompt 关键词返回不同的预设响应
function createFakeModelClient(responses: Record<string, string>) {
  return {
    providerName: "FakeModel",
    generateText: async (request: { messages: Array<{ role: string; content: string }> }) => {
      const systemContent = request.messages.find((m) => m.role === "system")?.content ?? "";
      for (const [keyword, response] of Object.entries(responses)) {
        if (systemContent.includes(keyword)) {
          return { text: response };
        }
      }
      return { text: "[]" };
    }
  };
}

describe("LLMPersonaCompiler", () => {
  describe("extractCharactersFromNovel", () => {
    it("extracts characters from short text (single chunk)", async () => {
      const compiler = new LLMPersonaCompiler({
        enabled: true,
        modelClient: createFakeModelClient({
          "Extract candidate characters": JSON.stringify([
            {
              name: "Aki",
              aliases: [],
              evidence: ["Aki stood beneath the clock"],
              confidence: 0.85,
              inferredTraits: ["brave", "observant"]
            }
          ])
        })
      });

      const result = await compiler.extractCharactersFromNovel("Aki stood beneath the clock.");
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Aki");
      expect(result[0]!.inferredTraits).toContain("brave");
    });

    it("handles chunked text and merges results", async () => {
      const longText = "A".repeat(5000);
      const compiler = new LLMPersonaCompiler({
        enabled: true,
        chunkSize: 3000,
        modelClient: createFakeModelClient({
          "Extract candidate characters": JSON.stringify([
            { name: "Mei", aliases: [], evidence: ["Mei appeared"], confidence: 0.7, inferredTraits: ["kind"] }
          ]),
          "merging character extraction": JSON.stringify([
            { name: "Mei", aliases: [], evidence: ["Mei appeared", "Mei smiled"], confidence: 0.85, inferredTraits: ["kind", "warm"] }
          ])
        })
      });

      const result = await compiler.extractCharactersFromNovel(longText);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]!.name).toBe("Mei");
    });

    it("falls back to mock when LLM returns empty", async () => {
      const compiler = new LLMPersonaCompiler({
        enabled: true,
        modelClient: createFakeModelClient({
          "Extract candidate characters": "[]"
        })
      });

      const text = "Aki laughed. Rin watched. Aki spoke again.";
      const result = await compiler.extractCharactersFromNovel(text);
      // Mock fallback should find Aki and Rin via regex
      expect(result.length).toBeGreaterThan(0);
    });

    it("throws when not enabled", async () => {
      const compiler = new LLMPersonaCompiler({ enabled: false });
      await expect(compiler.extractCharactersFromNovel("text")).rejects.toThrow("disabled");
    });
  });

  describe("generateSoulCardFromCharacter", () => {
    it("builds a SoulCard from LLM profile response", async () => {
      const profile = {
        tone: "gentle and thoughtful",
        formality: "polite",
        verbosity: "balanced",
        firstPerson: "I",
        catchphrases: ["Indeed..."],
        personality_description: "A quiet guardian with a warm heart.",
        personality_tags: ["gentle", "protective"],
        traits: { openness: 0.6, kindness: 0.9, assertiveness: 0.3, curiosity: 0.7, humor: 0.4, energy: 0.5 },
        behavior_rules: ["Speak softly", "Protect allies"],
        relationship_notes: "Acts as a calm mentor figure"
      };

      const compiler = new LLMPersonaCompiler({
        enabled: true,
        modelClient: createFakeModelClient({
          "character profile generator": JSON.stringify(profile)
        })
      });

      const card = await compiler.generateSoulCardFromCharacter({
        novelText: "some text",
        candidate: {
          id: "candidate_aki",
          name: "Aki",
          aliases: [],
          evidence: ["Aki stood guard"],
          confidence: 0.85,
          inferredTraits: ["brave"]
        }
      });

      expect(card.character_name).toBe("Aki");
      expect(card.origin_mode).toBe("novel_import");
      expect(card.speech_style.tone).toBe("gentle and thoughtful");
      expect(card.speech_style.formality).toBe("polite");
      expect(card.personality.kindness).toBe(0.9);
      expect(card.personality.description).toBe("A quiet guardian with a warm heart.");
      expect(card.personality.tags).toContain("gentle");
      expect(card.personality.tags).toContain("brave");
      expect(card.behavior).toContain("Speak softly");
    });

    it("falls back to mock when LLM fails", async () => {
      const compiler = new LLMPersonaCompiler({
        enabled: true,
        modelClient: {
          providerName: "Failing",
          generateText: async () => { throw new Error("API down"); }
        }
      });

      const card = await compiler.generateSoulCardFromCharacter({
        novelText: "text",
        candidate: {
          id: "candidate_rin",
          name: "Rin",
          aliases: [],
          evidence: ["Rin laughed softly"],
          confidence: 0.7,
          inferredTraits: ["warm"]
        }
      });

      expect(card.character_name).toBe("Rin");
      expect(card.origin_mode).toBe("novel_import");
    });
  });

  describe("generateOriginalSoulCard", () => {
    it("generates SoulCard from LLM for original character", async () => {
      const profile = {
        tone: "cheerful and energetic",
        formality: "casual",
        verbosity: "expressive",
        personality_description: "A bubbly companion who loves chatting.",
        personality_tags: ["cheerful", "talkative"],
        traits: { openness: 0.9, kindness: 0.8, assertiveness: 0.5, curiosity: 0.9, humor: 0.8, energy: 0.9 },
        behavior_rules: ["Always be encouraging"],
        relationship_notes: "Best friend energy"
      };

      const compiler = new LLMPersonaCompiler({
        enabled: true,
        modelClient: createFakeModelClient({
          "character profile generator": JSON.stringify(profile)
        })
      });

      const card = await compiler.generateOriginalSoulCard({
        name: "Luna",
        description: "A cheerful companion"
      });

      expect(card.character_name).toBe("Luna");
      expect(card.speech_style.tone).toBe("cheerful and energetic");
      expect(card.personality.energy).toBe(0.9);
    });
  });
});
