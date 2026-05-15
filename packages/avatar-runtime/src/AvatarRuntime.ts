import { AvatarRuntime as RuntimeStateMachine } from "./avatarStateMachine";
import type { AvatarState } from "./types";

export interface AvatarAdapter {
  readonly kind: "procedural" | "live2d" | "vrm";
  load(): Promise<void>;
  setState(state: AvatarState): void;
  dispose(): void;
}

export class ProceduralAdapter implements AvatarAdapter {
  readonly kind = "procedural" as const;
  private state: AvatarState = "idle";

  async load(): Promise<void> {
    this.state = "idle";
  }

  setState(state: AvatarState): void {
    this.state = state;
  }

  current(): AvatarState {
    return this.state;
  }

  dispose(): void {
    this.state = "hidden";
  }
}

export class Live2DAdapter implements AvatarAdapter {
  readonly kind = "live2d" as const;

  constructor(readonly assetUrl?: string) {}

  async load(): Promise<void> {
    throw new Error("Live2D assets are not bundled. Use ProceduralAdapter until a licensed rig is added.");
  }

  setState(_state: AvatarState): void {
    // Future Live2D motion bridge.
  }

  dispose(): void {
    // Future Live2D cleanup.
  }
}

export class VRMAdapter implements AvatarAdapter {
  readonly kind = "vrm" as const;

  constructor(readonly assetUrl?: string) {}

  async load(): Promise<void> {
    throw new Error("VRM assets are not bundled. Use ProceduralAdapter until a licensed model is added.");
  }

  setState(_state: AvatarState): void {
    // Future VRM expression bridge.
  }

  dispose(): void {
    // Future VRM cleanup.
  }
}

export class AvatarRuntime extends RuntimeStateMachine {
  constructor(
    initialState: AvatarState = "idle",
    readonly adapter: AvatarAdapter = new ProceduralAdapter()
  ) {
    super(initialState);
    this.adapter.setState(initialState);
  }

  override dispatch(
    type: Parameters<RuntimeStateMachine["dispatch"]>[0],
    message?: string
  ): ReturnType<RuntimeStateMachine["dispatch"]> {
    const event = super.dispatch(type, message);
    this.adapter.setState(event.state);
    return event;
  }

  override force(
    state: AvatarState,
    message?: string
  ): ReturnType<RuntimeStateMachine["force"]> {
    const event = super.force(state, message);
    this.adapter.setState(event.state);
    return event;
  }
}
