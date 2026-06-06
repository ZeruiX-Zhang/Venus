import type { MemoryItem, MemoryPolicy } from "@personal-character-agent/shared";
import type { MemoryStore } from "./types";

export interface MemoryLifecycleManager {
  onSessionEnd(sessionId: string): Promise<number>;
  enforceCapacity(maxMemories?: number): Promise<MemoryItem[]>;
  deduplicateMemories(similarityThreshold?: number): Promise<number>;
}

// 计算两条记忆的文本相似度（Jaccard 系数，基于 token 集合）
function tokenSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(s.toLowerCase().split(/[\s,，。！？、;；：:]+/).filter((t) => t.length > 1));
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// 根据时间计算衰减分数：越新分数越高
function recencyScore(isoDate: string): number {
  const ageMs = Date.now() - new Date(isoDate).getTime();
  const ageDays = ageMs / 86_400_000;
  // 指数衰减：半衰期 30 天
  return Math.exp(-0.693 * (ageDays / 30));
}

export class DefaultMemoryLifecycleManager implements MemoryLifecycleManager {
  constructor(
    private readonly store: MemoryStore,
    private readonly policy?: MemoryPolicy
  ) {}

  // 删除标记为 session-only 的记忆（通过 tag 识别）
  async onSessionEnd(sessionId: string): Promise<number> {
    const all = await this.store.listMemories();
    const toRemove = all.filter(
      (m) =>
        m.tags.includes("session-only") &&
        m.tags.includes(`session:${sessionId}`)
    );
    for (const m of toRemove) {
      await this.store.deleteMemory(m.id);
    }
    return toRemove.length;
  }

  // 容量淘汰：按 importance × recency 评分，删掉最低分的
  async enforceCapacity(maxMemories?: number): Promise<MemoryItem[]> {
    const limit = maxMemories ?? 200;
    const all = await this.store.listMemories();
    if (all.length <= limit) return [];

    const scored = all.map((item) => ({
      item,
      score: item.importance * 0.7 + recencyScore(item.updatedAt) * 0.3
    }));
    scored.sort((a, b) => a.score - b.score);

    const evictCount = all.length - limit;
    const toEvict = scored.slice(0, evictCount);
    for (const { item } of toEvict) {
      await this.store.deleteMemory(item.id);
    }
    return toEvict.map(({ item }) => item);
  }

  // 去重：同类型记忆中，文本相似度高于阈值的合并（保留较新的那条）
  async deduplicateMemories(similarityThreshold = 0.7): Promise<number> {
    const all = await this.store.listMemories();
    const grouped: Record<string, MemoryItem[]> = {};
    for (const m of all) {
      if (!grouped[m.type]) grouped[m.type] = [];
      grouped[m.type]!.push(m);
    }

    const toDelete = new Set<string>();

    for (const items of Object.values(grouped)) {
      for (let i = 0; i < items.length; i++) {
        if (toDelete.has(items[i]!.id)) continue;
        for (let j = i + 1; j < items.length; j++) {
          if (toDelete.has(items[j]!.id)) continue;
          const sim = tokenSimilarity(items[i]!.content, items[j]!.content);
          if (sim >= similarityThreshold) {
            // 保留较新的（updatedAt 更大的），删除较旧的
            const older =
              items[i]!.updatedAt >= items[j]!.updatedAt
                ? items[j]!
                : items[i]!;
            toDelete.add(older.id);
          }
        }
      }
    }

    for (const id of toDelete) {
      await this.store.deleteMemory(id);
    }
    return toDelete.size;
  }
}
