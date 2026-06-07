// 用途：桌宠随机台词库 + 随机挑选逻辑。
// 古风、温雅的语气，贴合「玉璃清仪」人设。后续可以让 LLM 动态生成，这里先用静态库。

// 按情境分组的台词；目前混在一起随机抽，后续可按时间/状态筛选
export const PET_IDLE_LINES: string[] = [
  "妾在此处，静候君来。",
  "风过竹林，恍若故人轻语。",
  "可愿与妾共品一盏清茶？",
  "笔墨纸砚皆备，今日想听些什么？",
  "云生足下，心却系于君侧。",
  "若有烦忧，不妨说与妾听。",
  "夜色渐深，君亦当珍重身子。",
  "一花一世界，君且慢看。",
  "妾观君眉间似有心事。",
  "山高水长，幸得与君相伴。",
  "闲来无事，与君对坐亦是清欢。",
  "墨香未散，君可愿留步片刻？"
];

// 随机抽一条台词（避免和上一条重复）
export function pickRandomLine(exclude?: string): string {
  const pool = exclude ? PET_IDLE_LINES.filter((l) => l !== exclude) : PET_IDLE_LINES;
  const list = pool.length > 0 ? pool : PET_IDLE_LINES;
  return list[Math.floor(Math.random() * list.length)]!;
}
