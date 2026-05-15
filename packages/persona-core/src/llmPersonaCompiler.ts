import type { ModelClient } from "@personal-character-agent/agent-core";
import {
  createDefaultSoulCard,
  type SoulCard
} from "@personal-character-agent/shared";
import type {
  CharacterCandidate,
  NovelPersonaInput,
  OriginalCharacterInput,
  PersonaCompiler
} from "./types";
import { MockPersonaCompiler } from "./mockPersonaCompiler";

export interface LLMPersonaCompilerOptions {
  modelClient?: ModelClient;
  enabled: boolean;
}

export class LLMPersonaCompiler implements PersonaCompiler {
  private readonly fallback = new MockPersonaCompiler();

  constructor(private readonly options: LLMPersonaCompilerOptions) {}

  async extractCharactersFromNovel(input: string): Promise<CharacterCandidate[]> {
    const modelClient = this.getModelClient();
    await modelClient.generateText({
      messages: [
        {
          role: "system",
          content:
            "Extract candidate characters from the text. Return compact JSON."
        },
        {
          role: "user",
          content: input.slice(0, 12000)
        }
      ]
    });

    return this.fallback.extractCharactersFromNovel(input);
  }

  async generateSoulCardFromCharacter(
    input: NovelPersonaInput
  ): Promise<SoulCard> {
    const modelClient = this.getModelClient();
    await modelClient.generateText({
      messages: [
        {
          role: "system",
          content: "Draft a SoulCard from the selected character evidence."
        },
        {
          role: "user",
          content: JSON.stringify(input)
        }
      ]
    });

    return this.fallback.generateSoulCardFromCharacter(input);
  }

  async generateOriginalSoulCard(
    input: OriginalCharacterInput
  ): Promise<SoulCard> {
    const modelClient = this.getModelClient();
    const response = await modelClient.generateText({
      messages: [
        {
          role: "system",
          content: "Draft a concise original character SoulCard."
        },
        {
          role: "user",
          content: JSON.stringify(input)
        }
      ]
    });

    const card = createDefaultSoulCard(input.name);
    return {
      ...card,
      personality: {
        ...card.personality,
        description: response.text || input.description
      }
    };
  }

  validateSoulCard = this.fallback.validateSoulCard.bind(this.fallback);

  private getModelClient(): ModelClient {
    if (!this.options.enabled || !this.options.modelClient) {
      throw new Error(
        "LLMPersonaCompiler is disabled. Configure a ModelClient before enabling it."
      );
    }

    return this.options.modelClient;
  }
}
