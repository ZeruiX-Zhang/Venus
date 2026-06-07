// 用途：小游戏的本地数据（求签签文库 + 飞花令诗句库）。
// 纯本地，无需联网/API，保证离线可玩。后续飞花令可升级为 LLM 实时生成。

// —— 求签 ——
export interface Fortune {
  level: "上上签" | "上签" | "中签" | "下签";
  poem: string; // 签诗
  reading: string; // 解读
}

export const FORTUNES: Fortune[] = [
  { level: "上上签", poem: "云开见月明，舟行水自平。", reading: "拨云见日，诸事渐顺，宜把握良机，主动则得善果。" },
  { level: "上签", poem: "桃花春带雨，柳絮暖随风。", reading: "良缘将至，待人以诚、处事以柔，自有花开之时。" },
  { level: "上签", poem: "竹影扫阶尘不动，月穿潭底水无痕。", reading: "心静则安，外扰难侵；守得本心，吉。" },
  { level: "中签", poem: "山重水复疑无路，柳暗花明又一村。", reading: "眼前虽有困局，莫急莫躁，转机已在不远。" },
  { level: "中签", poem: "潮起潮落本无常，静待东风借力来。", reading: "时机未到，宜养精蓄锐，不可冒进。" },
  { level: "中签", poem: "雾里看花终隔层，且待天清自分明。", reading: "事有疑惑，暂缓决断；待明朗再行，无妨。" },
  { level: "下签", poem: "孤舟夜泊江风冷，独对寒星到天明。", reading: "近期多阻，宜守不宜进，谨言慎行可避祸。" },
  { level: "下签", poem: "落花有意随流水，流水无情恋落花。", reading: "缘分未谐，强求无益；随顺自然，心宽则安。" }
];

export function drawFortune(): Fortune {
  return FORTUNES[Math.floor(Math.random() * FORTUNES.length)]!;
}

// —— 飞花令 ——
// 每个令字对应一组含该字的名句；玩家与角色轮流接句，用过的不再重复。
export const FEIHUA_LINES: Record<string, string[]> = {
  花: [
    "花谢花飞花满天",
    "人面桃花相映红",
    "春城无处不飞花",
    "花径不曾缘客扫",
    "晓看红湿处，花重锦官城",
    "桃花潭水深千尺",
    "乱花渐欲迷人眼",
    "花自飘零水自流",
    "竹外桃花三两枝",
    "感时花溅泪，恨别鸟惊心"
  ],
  月: [
    "明月几时有，把酒问青天",
    "举头望明月，低头思故乡",
    "月落乌啼霜满天",
    "海上生明月，天涯共此时",
    "月上柳梢头，人约黄昏后",
    "二十四桥明月夜",
    "露从今夜白，月是故乡明",
    "野旷天低树，江清月近人",
    "明月松间照，清泉石上流",
    "我寄愁心与明月"
  ],
  风: [
    "春风又绿江南岸",
    "夜来风雨声，花落知多少",
    "随风潜入夜，润物细无声",
    "风急天高猿啸哀",
    "古道西风瘦马",
    "风萧萧兮易水寒",
    "大风起兮云飞扬",
    "不知细叶谁裁出，二月春风似剪刀",
    "长风破浪会有时",
    "林暗草惊风，将军夜引弓"
  ]
};

export const FEIHUA_CHARS = Object.keys(FEIHUA_LINES);

// 角色从某令字的诗句库里挑一句还没用过的；没有则返回 null（角色认输）
export function pickFeihuaLine(char: string, used: string[]): string | null {
  const pool = (FEIHUA_LINES[char] ?? []).filter((line) => !used.includes(line));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)]!;
}
