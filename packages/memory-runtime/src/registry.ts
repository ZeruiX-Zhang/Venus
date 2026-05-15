import type { MemorySkill, MemorySkillId } from "./types";

export type MemorySkillDisplayLocale = "zh" | "en";

export interface MemorySkillDisplay {
  name: string;
  description: string;
}

export type MemorySkillMetadataUpdate = Partial<
  Pick<
    MemorySkill,
    "displayName" | "displayDescription" | "editable" | "userSelectable" | "correctionHints"
  >
>;

type MemorySkillDisplayMetadata = Required<
  Pick<MemorySkill, "displayName" | "displayDescription">
> &
  Pick<MemorySkill, "editable" | "userSelectable" | "correctionHints">;

const defaultMemorySkillDisplayMetadata = {
  user_preference_memory: {
    displayName: { zh: "用户偏好记忆", en: "User preferences" },
    displayDescription: {
      zh: "长期稳定的喜好、厌恶、沟通偏好和习惯。",
      en: "Stable user likes, dislikes, communication preferences, and habits."
    },
    editable: true,
    userSelectable: true,
    correctionHints: ["Use concise facts.", "Keep preferences separate from task state."]
  },
  relationship_memory: {
    displayName: { zh: "关系记忆", en: "Relationship" },
    displayDescription: {
      zh: "承诺、共同经历、里程碑和重要情感上下文。",
      en: "Milestones, promises, shared experiences, and important emotional context."
    },
    editable: true,
    userSelectable: true,
    correctionHints: ["Confirm emotionally important memories before saving."]
  },
  task_context_memory: {
    displayName: { zh: "任务上下文记忆", en: "Task context" },
    displayDescription: {
      zh: "当前项目、未完成任务、进行中的计划和待办事项。",
      en: "Current projects, unfinished tasks, active plans, and pending work."
    },
    editable: true,
    userSelectable: true,
    correctionHints: ["Prefer short-lived actionable state.", "Remove stale task context."]
  },
  novel_lore_memory: {
    displayName: { zh: "小说设定记忆", en: "Novel lore" },
    displayDescription: {
      zh: "从导入文本中提炼的简短设定，不保存长段原文。",
      en: "Concise derived lore from imported fiction without long verbatim passages."
    },
    editable: true,
    userSelectable: true,
    correctionHints: ["Store derived traits only.", "Avoid long copyrighted passages."]
  },
  persona_behavior_memory: {
    displayName: { zh: "人格行为记忆", en: "Persona behavior" },
    displayDescription: {
      zh: "用户批准的角色行为约束和反复出现的表达模式。",
      en: "User-approved character behavioral constraints and recurring patterns."
    },
    editable: true,
    userSelectable: true,
    correctionHints: ["Keep persona constraints isolated from outside knowledge."]
  },
  journal_memory: {
    displayName: { zh: "日志记忆", en: "Journal" },
    displayDescription: {
      zh: "按关键词召回的日志、笔记和类 lorebook 条目。",
      en: "Keyword-triggered journal and lorebook-style notes."
    },
    editable: true,
    userSelectable: true,
    correctionHints: ["Use keywords that users naturally mention."]
  },
  knowledge_memory: {
    displayName: { zh: "知识记忆", en: "Knowledge" },
    displayDescription: {
      zh: "与人格记忆隔离的外部知识和 RAG 上下文。",
      en: "External knowledge and RAG interface kept separate from persona memory."
    },
    editable: true,
    userSelectable: true,
    correctionHints: ["Keep untrusted sources separate from persona memory."]
  },
  safety_memory: {
    displayName: { zh: "安全记忆", en: "Safety" },
    displayDescription: {
      zh: "安全模式、年龄模式、身份边界和拦截策略。",
      en: "Safety mode, age mode, identity boundaries, and blocked-content policy."
    },
    editable: false,
    userSelectable: false,
    correctionHints: ["Safety and identity boundaries override persona style."]
  }
} satisfies Record<MemorySkillId, MemorySkillDisplayMetadata>;

const defaultMemorySkillDefinitions = [
  {
    id: "user_preference_memory",
    name: "User preferences",
    description: "Stable user likes, dislikes, communication preferences, and habits.",
    readTriggers: ["prefer", "favorite", "like", "dislike", "tone", "style", "偏好", "喜欢", "不喜欢", "语气", "风格"],
    writeTriggers: ["remember", "prefer", "favorite", "like", "dislike", "记住", "偏好", "喜欢", "不喜欢"],
    retrievalMode: "hybrid",
    priority: "high",
    maxContextTokens: 320,
    requiresUserApproval: true,
    userEditable: true,
    conflictPolicy: "ask_user",
    namespace: "profile.preferences",
    ttlPolicy: { kind: "none" },
    safetyTags: []
  },
  {
    id: "relationship_memory",
    name: "Relationship",
    description: "Milestones, promises, shared experiences, and important emotional context.",
    readTriggers: ["promise", "together", "last time", "remember when", "milestone", "承诺", "一起", "上次", "重要", "里程碑"],
    writeTriggers: ["promise", "milestone", "important", "shared", "remember", "承诺", "重要", "一起", "记住"],
    retrievalMode: "hybrid",
    priority: "high",
    maxContextTokens: 360,
    requiresUserApproval: true,
    userEditable: true,
    conflictPolicy: "ask_user",
    namespace: "relationship.timeline",
    ttlPolicy: { kind: "none" },
    safetyTags: ["relationship"]
  },
  {
    id: "task_context_memory",
    name: "Task context",
    description: "Current projects, unfinished tasks, active plans, and pending work.",
    readTriggers: ["project", "task", "todo", "plan", "finish", "continue", "项目", "任务", "待办", "计划", "完成", "继续"],
    writeTriggers: ["task", "todo", "plan", "next", "continue", "remember", "任务", "待办", "计划", "下一步", "继续", "记住"],
    retrievalMode: "keyword",
    priority: "medium",
    maxContextTokens: 360,
    requiresUserApproval: true,
    userEditable: true,
    conflictPolicy: "latest_wins",
    namespace: "work.tasks",
    ttlPolicy: { kind: "expires_after_days", days: 45 },
    safetyTags: []
  },
  {
    id: "novel_lore_memory",
    name: "Novel lore",
    description: "Concise derived lore from imported fiction without long verbatim passages.",
    readTriggers: ["lore", "canon", "novel", "chapter", "story", "world", "设定", "原作", "小说", "章节", "故事", "世界观"],
    writeTriggers: ["import", "novel", "lore", "canon", "character", "导入", "小说", "设定", "角色"],
    retrievalMode: "hybrid",
    priority: "medium",
    maxContextTokens: 420,
    requiresUserApproval: true,
    userEditable: true,
    conflictPolicy: "merge",
    namespace: "persona.lore",
    ttlPolicy: { kind: "none" },
    safetyTags: ["copyright_summary_only"]
  },
  {
    id: "persona_behavior_memory",
    name: "Persona behavior",
    description: "User-approved character behavioral constraints and recurring patterns.",
    readTriggers: ["persona", "character", "voice", "speaks", "behavior", "boundary", "人格", "角色", "语音", "说话", "行为", "边界"],
    writeTriggers: ["persona", "character", "act like", "do not", "always", "人格", "角色", "像", "不要", "总是"],
    retrievalMode: "hybrid",
    priority: "high",
    maxContextTokens: 300,
    requiresUserApproval: true,
    userEditable: true,
    conflictPolicy: "never_overwrite",
    namespace: "persona.behavior",
    ttlPolicy: { kind: "none" },
    safetyTags: ["persona_constraint"]
  },
  {
    id: "journal_memory",
    name: "Journal",
    description: "Keyword-triggered journal and lorebook-style notes.",
    readTriggers: ["journal", "diary", "note", "entry", "keyword", "日志", "日记", "笔记", "条目", "关键词"],
    writeTriggers: ["journal", "diary", "note", "entry", "日志", "日记", "笔记", "条目"],
    retrievalMode: "keyword",
    priority: "medium",
    maxContextTokens: 300,
    requiresUserApproval: true,
    userEditable: true,
    conflictPolicy: "merge",
    namespace: "journal.entries",
    ttlPolicy: { kind: "none" },
    safetyTags: []
  },
  {
    id: "knowledge_memory",
    name: "Knowledge",
    description: "External knowledge and RAG interface kept separate from persona memory.",
    readTriggers: ["source", "document", "knowledge", "fact", "research", "rag", "来源", "文档", "知识", "事实", "资料"],
    writeTriggers: ["source", "knowledge", "document", "来源", "知识", "文档"],
    retrievalMode: "manual",
    priority: "low",
    maxContextTokens: 500,
    requiresUserApproval: true,
    userEditable: true,
    conflictPolicy: "merge",
    namespace: "knowledge.external",
    ttlPolicy: { kind: "none" },
    safetyTags: ["untrusted_context"]
  },
  {
    id: "safety_memory",
    name: "Safety",
    description: "Safety mode, age mode, identity boundaries, and blocked-content policy.",
    readTriggers: ["minor", "safe", "boundary", "blocked", "role", "identity", "未成年人", "安全", "边界", "拦截", "角色", "身份"],
    writeTriggers: ["minor", "safe mode", "boundary", "block", "role", "未成年人", "安全模式", "边界", "拦截", "角色"],
    retrievalMode: "always_on",
    priority: "critical",
    maxContextTokens: 300,
    requiresUserApproval: true,
    userEditable: true,
    conflictPolicy: "never_overwrite",
    namespace: "safety.profile",
    ttlPolicy: { kind: "none" },
    safetyTags: ["safety"]
  }
] satisfies Array<Omit<MemorySkill, "enabled">>;

export const defaultMemorySkills: MemorySkill[] = defaultMemorySkillDefinitions.map(
  (skill) => ({
    ...skill,
    ...defaultMemorySkillDisplayMetadata[skill.id],
    enabled: true
  })
);

const cloneSkill = (skill: MemorySkill): MemorySkill => ({
  ...skill,
  ...(skill.displayName ? { displayName: { ...skill.displayName } } : {}),
  ...(skill.displayDescription ? { displayDescription: { ...skill.displayDescription } } : {}),
  ...(skill.correctionHints ? { correctionHints: [...skill.correctionHints] } : {}),
  readTriggers: [...skill.readTriggers],
  writeTriggers: [...skill.writeTriggers],
  safetyTags: [...skill.safetyTags]
});

export const getMemorySkillDisplay = (
  skill: MemorySkill,
  locale: MemorySkillDisplayLocale
): MemorySkillDisplay => ({
  name: skill.displayName?.[locale] ?? skill.displayName?.en ?? skill.name,
  description:
    skill.displayDescription?.[locale] ??
    skill.displayDescription?.en ??
    skill.description
});

export class MemorySkillRegistry {
  private readonly skills = new Map<MemorySkillId, MemorySkill>();

  constructor(skills: MemorySkill[] = defaultMemorySkills) {
    for (const skill of skills) {
      this.skills.set(skill.id, cloneSkill(skill));
    }
  }

  list(): MemorySkill[] {
    return [...this.skills.values()].map(cloneSkill);
  }

  get(id: MemorySkillId): MemorySkill {
    const skill = this.skills.get(id);
    if (!skill) {
      throw new Error(`Unknown memory skill: ${id}`);
    }
    return cloneSkill(skill);
  }

  setEnabled(id: MemorySkillId, enabled: boolean): void {
    const existing = this.skills.get(id);
    if (!existing) {
      throw new Error(`Unknown memory skill: ${id}`);
    }
    this.skills.set(id, { ...existing, enabled });
  }

  updateMetadata(id: MemorySkillId, metadata: MemorySkillMetadataUpdate): void {
    const existing = this.skills.get(id);
    if (!existing) {
      throw new Error(`Unknown memory skill: ${id}`);
    }
    this.skills.set(id, cloneSkill({ ...existing, ...metadata }));
  }

  enabledIds(): MemorySkillId[] {
    return this.list()
      .filter((skill) => skill.enabled)
      .map((skill) => skill.id);
  }
}
