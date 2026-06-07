// 用途：极简"动画总线"。表情按钮（在聊天区）点击时，通知舞台上的 3D 模型
// 播放对应序号的骨骼动画片段。两个组件分处不同位置，用这个解耦的发布/订阅连接。

type ClipListener = (clipIndex: number) => void;

let listeners: ClipListener[] = [];

// 订阅：舞台模型注册一个"播放第 N 个动画"的回调，返回取消订阅函数
export function onPlayCharacterClip(fn: ClipListener): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

// 发布：让所有订阅者播放第 clipIndex 个动画片段
export function playCharacterClip(clipIndex: number): void {
  for (const fn of listeners) fn(clipIndex);
}
