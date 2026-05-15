import { MemorySkillRegistry } from "./registry";
import type {
  MemoryAgentState,
  MemoryCandidate,
  MemoryPacket,
  MemoryPriority,
  MemoryRecord,
  MemoryRetrievalBudget,
  MemorySkill,
  MemorySkillId,
  MemorySkillStore,
  MemoryWriteSuggestion
} from "./types";

const priorityRank: Record<MemoryPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

const sensitivePattern =
  /\b(password|api key|secret|token|ssn|social security|credit card|bank account|medical|diagnosis|address|phone|email)\b|密码|密钥|令牌|身份证|银行卡|银行账户|医疗|诊断|地址|电话|邮箱/i;

const tokenEstimate = (text: string): number => Math.max(1, Math.ceil(text.length / 4));

const makeId = (prefix: string): string => {
  const maybeCrypto = globalThis.crypto as Crypto | undefined;
  return maybeCrypto?.randomUUID
    ? `${prefix}_${maybeCrypto.randomUUID()}`
    : `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
};

const nowIso = (): string => new Date().toISOString();

const normalizedWords = (input: string): Set<string> =>
  new Set(input.toLowerCase().match(/[a-z0-9]{3,}|[\u4e00-\u9fff]/gu) ?? []);

const textMatches = (input: string, triggers: string[]): boolean => {
  const normalized = input.toLowerCase();
  return triggers.some((trigger) => normalized.includes(trigger.toLowerCase()));
};

export const createAlwaysOnMemoryPackets = (
  state: MemoryAgentState
): MemoryPacket[] => [
  {
    id: "core_active_character_identity",
    coreBlockId: "active_character_identity",
    namespace: "core.identity",
    content: state.language === "zh"
      ? `当前角色：${state.characterName}。该角色是虚构个人陪伴者，不是真人，也不是持证专业人士。`
      : `Active character: ${state.characterName}. The character is a fictional personal companion, not a human and not a licensed professional.`,
    priority: "critical",
    tokenEstimate: 42,
    reason: state.language === "zh" ? "固定身份块。" : "Pinned identity block.",
    source: "core",
    sourceMetadata: { pinned: true }
  },
  {
    id: "core_active_persona_core",
    coreBlockId: "active_persona_core",
    namespace: "core.persona",
    content: state.activePersonaSummary,
    priority: "critical",
    tokenEstimate: tokenEstimate(state.activePersonaSummary),
    reason: state.language === "zh" ? "固定激活人格块。" : "Pinned active persona block.",
    source: "core",
    sourceMetadata: { pinned: true }
  },
  {
    id: "core_user_profile_summary",
    coreBlockId: "user_profile_summary",
    namespace: "core.user",
    content: state.userProfileSummary || (state.language === "zh" ? "尚未批准长期用户画像摘要。" : "No durable user profile summary has been approved yet."),
    priority: "critical",
    tokenEstimate: tokenEstimate(state.userProfileSummary || (state.language === "zh" ? "尚未批准长期用户画像摘要。" : "No durable user profile summary has been approved yet.")),
    reason: state.language === "zh" ? "固定用户画像摘要。" : "Pinned user profile summary.",
    source: "core",
    sourceMetadata: { pinned: true }
  },
  {
    id: "core_relationship_contract",
    coreBlockId: "relationship_contract",
    namespace: "core.relationship",
    content: state.relationshipContract,
    priority: "critical",
    tokenEstimate: tokenEstimate(state.relationshipContract),
    reason: state.language === "zh" ? "固定关系契约。" : "Pinned relationship contract.",
    source: "core",
    sourceMetadata: { pinned: true }
  },
  {
    id: "core_safety_profile",
    coreBlockId: "safety_profile",
    namespace: "core.safety",
    content: state.language === "zh"
      ? `安全模式：${state.safetyMode}。安全和身份规则覆盖人格风格。`
      : `Safety mode: ${state.safetyMode}. Safety and identity rules override persona style.`,
    priority: "critical",
    tokenEstimate: 28,
    reason: state.language === "zh" ? "固定安全配置。" : "Pinned safety profile.",
    source: "core",
    sourceMetadata: { pinned: true, safetyMode: state.safetyMode }
  },
  {
    id: "core_current_scene",
    coreBlockId: "current_scene",
    namespace: "core.scene",
    content: state.currentScene || (state.language === "zh" ? "当前场景：平静的桌面陪伴对话。" : "Current scene: calm desktop companion chat."),
    priority: "critical",
    tokenEstimate: tokenEstimate(state.currentScene || (state.language === "zh" ? "当前场景：平静的桌面陪伴对话。" : "Current scene: calm desktop companion chat.")),
    reason: state.language === "zh" ? "固定当前场景。" : "Pinned current scene.",
    source: "core",
    sourceMetadata: { pinned: true }
  }
];

export const selectMemorySkills = (
  input: string,
  state: MemoryAgentState,
  registry = new MemorySkillRegistry()
): MemorySkill[] => {
  const enabled = new Set(state.enabledMemorySkillIds ?? registry.enabledIds());
  const selected = registry
    .list()
    .filter((skill) => enabled.has(skill.id) && skill.enabled)
    .filter((skill) => {
      if (skill.retrievalMode === "always_on") {
        return true;
      }
      if (skill.retrievalMode === "manual") {
        return textMatches(input, skill.readTriggers);
      }
      return textMatches(input, skill.readTriggers);
    });

  return selected.sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]);
};

export const retrieveMemoryPackets = async (
  selectedSkills: MemorySkill[],
  input: string,
  budget: MemoryRetrievalBudget,
  store: MemorySkillStore,
  state: MemoryAgentState
): Promise<MemoryPacket[]> => {
  const alwaysOn = createAlwaysOnMemoryPackets(state);
  const selectedIds = new Set(selectedSkills.map((skill) => skill.id));
  const records = (await store.listRecords())
    .filter((record) => record.approvalStatus === "approved")
    .filter((record) => selectedIds.has(record.skillId))
    .filter((record) => !record.expiresAt || record.expiresAt > nowIso());
  const inputWords = normalizedWords(input);
  const scored = records
    .map((record) => {
      const haystack = normalizedWords(`${record.content} ${record.summary ?? ""} ${record.namespace}`);
      let score = priorityRank[record.priority] * 10;
      for (const word of inputWords) {
        if (haystack.has(word)) {
          score += 4;
        }
      }
      if (record.skillId === "safety_memory") {
        score += 20;
      }
      return { record, score };
    })
    .sort((a, b) => b.score - a.score || b.record.updatedAt.localeCompare(a.record.updatedAt));

  const packets: MemoryPacket[] = [...alwaysOn];
  let used = alwaysOn.reduce((sum, packet) => sum + packet.tokenEstimate, 0);
  const maxPackets = budget.maxPackets ?? 18;

  for (const { record, score } of scored) {
    const skill = selectedSkills.find((item) => item.id === record.skillId);
    const nextTokens = tokenEstimate(record.summary ?? record.content);
    if (!skill || nextTokens > skill.maxContextTokens) {
      continue;
    }
    if (used + nextTokens > budget.maxTotalTokens || packets.length >= maxPackets) {
      break;
    }
    used += nextTokens;
    packets.push({
      id: `packet_${record.id}`,
      skillId: record.skillId,
      namespace: record.namespace,
      content: record.summary ?? record.content,
      priority: record.priority,
      tokenEstimate: nextTokens,
      reason: `Recalled by ${skill.name} with score ${score}.`,
      source: record.skillId === "knowledge_memory" ? "knowledge" : "memory",
      sourceMetadata: {
        recordId: record.id,
        skillId: record.skillId,
        updatedAt: record.updatedAt
      }
    });
  }

  return packets;
};

export const assembleMemoryContext = (packets: MemoryPacket[]): string => {
  const personaAndMemory = packets.filter((packet) => packet.source !== "knowledge");
  const knowledge = packets.filter((packet) => packet.source === "knowledge");
  const format = (packet: MemoryPacket): string =>
    `[${packet.namespace}] ${packet.content}\nsource=${packet.source}; reason=${packet.reason}`;

  return [
    "Pinned and selected memory context:",
    personaAndMemory.map(format).join("\n\n") || "No selected persona memory.",
    "External knowledge context:",
    knowledge.map(format).join("\n\n") || "No selected knowledge context."
  ].join("\n\n");
};

export const extractMemoryCandidates = (
  input: string,
  response: string,
  _state: MemoryAgentState
): MemoryCandidate[] => {
  const candidates: MemoryCandidate[] = [];
  const explicit =
    /(?:please\s+)?remember(?:\s+that)?\s+(.+)/i.exec(input) ??
    /save\s+this\s+memory\s*:\s*(.+)/i.exec(input) ??
    /(?:请)?记住(?:一下|：|:|\s)*(.*)/u.exec(input);
  const preference =
    /\b(?:i like|i love|my favorite|i prefer|please use)\b\s+([^.!?]+)/i.exec(input) ??
    /我(?:喜欢|偏好|更喜欢|希望你)([^。！？]+)/u.exec(input);
  const task =
    /\b(?:todo|task|next step|plan)\b\s*:?\s*(.+)/i.exec(input) ??
    /(?:待办|任务|下一步|计划)[:：]?\s*([^。！？]+)/u.exec(input);
  const relationship =
    /\b(?:promise|remember when|milestone|important to me)\b\s*:?\s*(.+)/i.exec(input) ??
    /(?:承诺|上次|里程碑|重要的是|一起)[:：]?\s*([^。！？]+)/u.exec(input);

  const add = (
    content: string,
    suggestedSkillId: MemorySkillId,
    reason: string,
    priority: MemoryPriority
  ) => {
    const cleaned = content.trim().replace(/^that\s+/i, "");
    if (!cleaned) {
      return;
    }
    candidates.push({
      id: makeId("candidate"),
      content: cleaned,
      reason,
      suggestedSkillId,
      source: "user",
      priority,
      safetyTags: sensitivePattern.test(cleaned) ? ["sensitive"] : [],
      sensitivity: sensitivePattern.test(cleaned) ? "sensitive" : "none"
    });
  };

  if (explicit?.[1]) {
    add(explicit[1], "user_preference_memory", "The user explicitly asked to remember this.", "high");
  }
  if (preference?.[0]) {
    add(preference[0], "user_preference_memory", "The user stated a stable preference.", "high");
  }
  if (task?.[1]) {
    add(task[1], "task_context_memory", "The user described an ongoing task or plan.", "medium");
  }
  if (relationship?.[1]) {
    add(relationship[1], "relationship_memory", "The user described relationship context.", "high");
  }
  if ((/memory suggestion/i.test(response) || /记忆建议/u.test(response)) && explicit?.[1] && candidates.length === 0) {
    add(explicit[1], "journal_memory", "The assistant acknowledged a memory request.", "medium");
  }

  return dedupeCandidates(candidates);
};

export const classifyCandidateToMemorySkill = (
  candidate: MemoryCandidate,
  registry = new MemorySkillRegistry()
): MemorySkill => registry.get(candidate.suggestedSkillId);

export const retrieveExistingRelatedMemory = async (
  candidate: MemoryCandidate,
  store: MemorySkillStore
): Promise<MemoryRecord | undefined> => {
  const words = normalizedWords(candidate.content);
  const records = await store.listRecords();
  return records.find((record) => {
    if (record.skillId !== candidate.suggestedSkillId) {
      return false;
    }
    const haystack = normalizedWords(record.content);
    let overlap = 0;
    for (const word of words) {
      if (haystack.has(word)) {
        overlap += 1;
      }
    }
    return overlap >= Math.min(3, Math.max(1, Math.floor(words.size / 2)));
  });
};

export const mergeOrCreateMemory = (
  candidate: MemoryCandidate,
  skill: MemorySkill,
  existing?: MemoryRecord
): MemoryRecord => {
  const timestamp = nowIso();
  const base: MemoryRecord = existing ?? {
    id: makeId("memory"),
    skillId: skill.id,
    namespace: skill.namespace,
    content: "",
    source: candidate.source,
    sourceMetadata: {},
    priority: candidate.priority,
    safetyTags: [],
    userEditable: skill.userEditable,
    approvalStatus: "pending",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const content =
    existing && skill.conflictPolicy === "merge" && !existing.content.includes(candidate.content)
      ? `${existing.content}\n${candidate.content}`
      : candidate.content;

  return {
    ...base,
    content,
    sourceMetadata: {
      ...base.sourceMetadata,
      reason: candidate.reason
    },
    priority: candidate.priority,
    safetyTags: [...new Set([...base.safetyTags, ...candidate.safetyTags, ...skill.safetyTags])],
    approvalStatus: "pending",
    updatedAt: timestamp
  };
};

export const validateMemory = (
  record: MemoryRecord,
  candidate: MemoryCandidate,
  skill: MemorySkill,
  existing?: MemoryRecord
): { valid: boolean; approvalRequired: boolean; conflict: boolean; reasons: string[] } => {
  const reasons: string[] = [];
  const conflict =
    Boolean(existing) &&
    skill.conflictPolicy !== "merge" &&
    skill.conflictPolicy !== "latest_wins";
  if (candidate.sensitivity === "sensitive") {
    reasons.push("Sensitive personal details require explicit approval.");
  }
  if (conflict) {
    reasons.push("The new memory may conflict with an existing approved memory.");
  }
  if (record.content.length > 900) {
    reasons.push("Memory is too long; store concise derived facts only.");
  }
  return {
    valid: record.content.trim().length > 0 && record.content.length <= 900,
    approvalRequired: skill.requiresUserApproval || candidate.sensitivity === "sensitive" || conflict,
    conflict,
    reasons
  };
};

export const askUserForApprovalIfNeeded = (
  candidate: MemoryCandidate,
  skill: MemorySkill,
  record: MemoryRecord,
  existing?: MemoryRecord,
  language: "zh" | "en" = "en"
): MemoryWriteSuggestion => {
  const validation = validateMemory(record, candidate, skill, existing);
  const status = !validation.valid ? "blocked" : validation.conflict ? "conflict" : "queued";
  return {
    id: makeId("memory_suggestion"),
    candidate,
    skill,
    approvalRequired: validation.approvalRequired,
    conflict: validation.conflict,
    ...(existing ? { existingRecord: existing } : {}),
    proposedRecord: {
      ...record,
      approvalStatus: validation.approvalRequired ? "pending" : "approved"
    },
    status,
    userFacingMessage:
      status === "conflict"
        ? language === "zh"
          ? "这可能与现有记忆冲突，请先检查再保存。"
          : "This may conflict with an existing memory. Please review it before saving."
        : validation.approvalRequired
          ? language === "zh"
            ? "如果你批准，我可以记住这条内容。"
            : "I can remember this if you approve it."
          : language === "zh"
            ? "已作为非敏感批准记忆保存。"
            : "Saved as a non-sensitive approved memory."
  };
};

export const saveMemory = async (
  suggestion: MemoryWriteSuggestion,
  store: MemorySkillStore
): Promise<MemoryRecord> => {
  const timestamp = nowIso();
  return store.upsertRecord({
    ...suggestion.proposedRecord,
    approvalStatus: "approved",
    updatedAt: timestamp
  });
};

export const observeUserEvent = (
  input: string,
  response: string,
  state: MemoryAgentState
): MemoryCandidate[] => extractMemoryCandidates(input, response, state);

export const createMemoryWriteSuggestions = async (
  input: string,
  response: string,
  state: MemoryAgentState,
  store: MemorySkillStore,
  registry = new MemorySkillRegistry()
): Promise<MemoryWriteSuggestion[]> => {
  const candidates = observeUserEvent(input, response, state);
  const suggestions: MemoryWriteSuggestion[] = [];
  for (const candidate of candidates) {
    const skill = classifyCandidateToMemorySkill(candidate, registry);
    const existing = await retrieveExistingRelatedMemory(candidate, store);
    const proposed = mergeOrCreateMemory(candidate, skill, existing);
    suggestions.push(askUserForApprovalIfNeeded(candidate, skill, proposed, existing, state.language ?? "en"));
  }
  return suggestions;
};

const dedupeCandidates = (candidates: MemoryCandidate[]): MemoryCandidate[] => {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.suggestedSkillId}:${candidate.content.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};
