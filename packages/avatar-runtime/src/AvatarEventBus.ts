import type { AvatarRuntimeEvent, AvatarState } from "./types";

export type AvatarEventListener = (event: AvatarRuntimeEvent) => void;

export class AvatarEventBus {
  private readonly listeners = new Set<AvatarEventListener>();

  subscribe(listener: AvatarEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(event: AvatarRuntimeEvent): void {
    for (const listener of this.listeners) {
      listener({ ...event });
    }
  }

  emitState(state: AvatarState, message?: string): AvatarRuntimeEvent {
    const event: AvatarRuntimeEvent = {
      id: `avatar_event_${Math.random().toString(36).slice(2, 10)}`,
      type: state === "error" ? "ERROR" : "RESPONSE_FINISHED",
      state,
      timestamp: new Date().toISOString(),
      ...(message ? { message } : {})
    };
    this.publish(event);
    return event;
  }
}
