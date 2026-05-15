import type { AvatarState } from "@personal-character-agent/shared";
import type { AvatarEventBus } from "./events";

export interface AvatarRuntime {
  bus: AvatarEventBus;
  getState(): AvatarState;
  setState(state: AvatarState, message?: string): void;
}

export class EventBusAvatarRuntime implements AvatarRuntime {
  constructor(public readonly bus: AvatarEventBus) {}

  getState(): AvatarState {
    return this.bus.getState();
  }

  setState(state: AvatarState, message?: string): void {
    this.bus.emitState(state, message);
  }
}
