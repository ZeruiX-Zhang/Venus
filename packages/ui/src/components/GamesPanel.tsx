// 用途：「雅趣」小游戏面板。当前包含：求签、飞花令。纯本地可玩。
import { useState } from "react";
import { Dices, Sparkles, RotateCcw, Send } from "lucide-react";
import { InspectorPanel } from "./InspectorPanel";
import { drawFortune, pickFeihuaLine, FEIHUA_CHARS, type Fortune } from "../lib/gamesData";

// 飞花令对局中的一句记录
interface FeihuaTurn {
  who: "user" | "her";
  line: string;
}

export function GamesPanel({ characterName = "玉璃清仪", isZh = true }: { characterName?: string; isZh?: boolean }) {
  return (
    <div className="pca-view">
      <header className="pca-view__header">
        <Dices size={20} />
        <div>
          <h1>{isZh ? "雅趣" : "Play"}</h1>
          <p>{isZh ? `与${characterName}对坐，求一签、对一令，闲来雅趣。` : `Idle games with ${characterName}: draw a fortune, trade poem lines.`}</p>
        </div>
      </header>

      <FortuneGame isZh={isZh} />
      <FeihuaGame characterName={characterName} isZh={isZh} />
    </div>
  );
}

// —— 求签 ——
function FortuneGame({ isZh }: { isZh: boolean }) {
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [drawing, setDrawing] = useState(false);

  const draw = () => {
    setDrawing(true);
    // 抽签时给一点仪式感的小延迟
    setTimeout(() => {
      setFortune(drawFortune());
      setDrawing(false);
    }, 600);
  };

  return (
    <InspectorPanel title={isZh ? "求签" : "Fortune"}>
      <div className="pca-game-fortune">
        {!fortune && !drawing && (
          <p className="pca-game-hint">{isZh ? "心中默念所问之事，再点「求签」。" : "Hold your question in mind, then draw."}</p>
        )}
        {drawing && <p className="pca-game-hint">{isZh ? "签筒轻摇……" : "Shaking the fortune sticks…"}</p>}
        {fortune && !drawing && (
          <div className={`pca-fortune-card pca-fortune-card--${fortune.level === "上上签" || fortune.level === "上签" ? "good" : fortune.level === "中签" ? "mid" : "low"}`}>
            <span className="pca-fortune-card__level">{fortune.level}</span>
            <p className="pca-fortune-card__poem">{fortune.poem}</p>
            <p className="pca-fortune-card__reading">{fortune.reading}</p>
          </div>
        )}
        <button className="pca-btn pca-btn--primary" onClick={draw} disabled={drawing} type="button">
          <Sparkles size={16} />
          <span>{fortune ? (isZh ? "再求一签" : "Draw again") : (isZh ? "求签" : "Draw")}</span>
        </button>
      </div>
    </InspectorPanel>
  );
}

// —— 飞花令 ——
function FeihuaGame({ characterName, isZh }: { characterName: string; isZh: boolean }) {
  const [token, setToken] = useState<string | null>(null); // 令字
  const [turns, setTurns] = useState<FeihuaTurn[]>([]);
  const [used, setUsed] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string>("");

  // 选定令字、开始对局
  const start = (char: string) => {
    setToken(char);
    setTurns([]);
    setUsed([]);
    setInput("");
    setStatus(isZh ? `请说一句含「${char}」字的诗句。` : `Say a line containing "${char}".`);
  };

  const reset = () => {
    setToken(null);
    setTurns([]);
    setUsed([]);
    setInput("");
    setStatus("");
  };

  // 提交玩家的诗句
  const submit = () => {
    if (!token) return;
    const line = input.trim();
    if (!line) return;
    // 宽松校验：只要包含令字即可
    if (!line.includes(token)) {
      setStatus(isZh ? `这句里没有「${token}」字哦，再想想~` : `That line has no "${token}".`);
      return;
    }
    if (used.includes(line)) {
      setStatus(isZh ? "这句已经用过啦，换一句~" : "Already used, try another.");
      return;
    }
    const afterUser: FeihuaTurn[] = [...turns, { who: "user", line }];
    const usedAfterUser = [...used, line];
    setInput("");

    // 角色应对
    const herLine = pickFeihuaLine(token, usedAfterUser);
    if (!herLine) {
      setTurns(afterUser);
      setUsed(usedAfterUser);
      setStatus(isZh ? `${characterName}一时语塞，甘拜下风，此局你赢了！` : `She's out of lines — you win!`);
      return;
    }
    setTurns([...afterUser, { who: "her", line: herLine }]);
    setUsed([...usedAfterUser, herLine]);
    setStatus(isZh ? `轮到你了，继续说含「${token}」字的诗句。` : `Your turn — another line with "${token}".`);
  };

  return (
    <InspectorPanel title={isZh ? "飞花令" : "Poem Duel (Feihua)"}>
      {!token ? (
        <div className="pca-feihua-start">
          <p className="pca-game-hint">{isZh ? "选一个令字，与她轮流对含此字的诗句。" : "Pick a token; take turns with lines containing it."}</p>
          <div className="pca-feihua-tokens">
            {FEIHUA_CHARS.map((c) => (
              <button className="pca-btn" key={c} onClick={() => start(c)} type="button">
                {isZh ? `令字 · ${c}` : c}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="pca-feihua">
          <div className="pca-feihua__token">{isZh ? `令字：${token}` : `Token: ${token}`}</div>
          <div className="pca-feihua__log">
            {turns.length === 0 && <p className="pca-game-hint">{status}</p>}
            {turns.map((t, i) => (
              <div className={`pca-feihua__line pca-feihua__line--${t.who}`} key={i}>
                <span className="pca-feihua__who">{t.who === "user" ? (isZh ? "你" : "You") : characterName}</span>
                <span className="pca-feihua__text">{t.line}</span>
              </div>
            ))}
          </div>
          {turns.length > 0 && <p className="pca-game-hint">{status}</p>}
          <div className="pca-feihua__input">
            <input
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder={isZh ? `含「${token}」字的诗句…` : `A line with "${token}"…`}
              value={input}
            />
            <button className="pca-btn pca-btn--primary" onClick={submit} type="button">
              <Send size={16} />
            </button>
          </div>
          <button className="pca-btn" onClick={reset} type="button">
            <RotateCcw size={15} />
            <span>{isZh ? "换令字 / 重来" : "Reset"}</span>
          </button>
        </div>
      )}
    </InspectorPanel>
  );
}

export default GamesPanel;
