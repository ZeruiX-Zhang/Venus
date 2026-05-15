import type { AvatarState, ISODateTime } from "@personal-character-agent/shared";

export interface AvatarRuntimeEvent {
  state: AvatarState;
  message?: string;
  timestamp: ISODateTime;
}

export type AvatarEventListener = (event: AvatarRuntimeEvent) => void;

export class AvatarEventBus {
  private listeners = new Set<AvatarEventListener>();
  private currentState: AvatarState = "idle";

  subscribe(listener: AvatarEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitState(state: AvatarState, message?: string): AvatarRuntimeEvent {
    this.currentState = state;
    const event: AvatarRuntimeEvent = {
      state,
      timestamp: new Date().toISOString()
    };

    if (message) {
      event.message = message;
    }

    for (const listener of this.listeners) {
      listener(event);
    }

    return event;
  }

  getState(): AvatarState {
    return this.currentState;
  }
}
