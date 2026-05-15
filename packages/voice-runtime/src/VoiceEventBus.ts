import type { VoicePlaybackEvent } from "./VoiceProfile";

export type VoiceEventListener = (event: VoicePlaybackEvent) => void;

export class VoiceEventBus {
  private readonly listeners = new Set<VoiceEventListener>();
  private readonly history: VoicePlaybackEvent[] = [];

  subscribe(listener: VoiceEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(event: VoicePlaybackEvent): void {
    const snapshot = { ...event };
    this.history.unshift(snapshot);
    this.history.splice(120);
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  listEvents(): VoicePlaybackEvent[] {
    return this.history.map((event) => ({ ...event }));
  }

  clear(): void {
    this.history.splice(0);
  }
}
