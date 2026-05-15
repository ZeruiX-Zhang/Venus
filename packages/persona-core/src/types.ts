import type { SoulCard, ValidationResult } from "@personal-character-agent/shared";

export interface CharacterCandidate {
  id: string;
  name: string;
  aliases: string[];
  evidence: string[];
  confidence: number;
  inferredTraits: string[];
}

export interface NovelPersonaInput {
  novelText: string;
  candidate: CharacterCandidate;
  userNotes?: string;
}

export interface OriginalCharacterInput {
  name: string;
  description: string;
  speechTone?: string;
  relationshipRole?: "companion" | "assistant" | "friend" | "mentor" | "rival";
}

export interface PersonaCompiler {
  extractCharactersFromNovel(input: string): Promise<CharacterCandidate[]>;
  generateSoulCardFromCharacter(input: NovelPersonaInput): Promise<SoulCard>;
  generateOriginalSoulCard(input: OriginalCharacterInput): Promise<SoulCard>;
  validateSoulCard(card: SoulCard): ValidationResult;
}
