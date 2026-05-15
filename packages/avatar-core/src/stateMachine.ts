import type { AvatarState } from "@personal-character-agent/shared";

const transitionMap: Record<AvatarState, AvatarState[]> = {
  idle: [
    "listening",
    "thinking",
    "speaking",
    "happy",
    "annoyed",
    "sleepy",
    "confused",
    "error",
    "hidden",
    "peeking",
    "edge_sitting"
  ],
  listening: ["thinking", "speaking", "idle", "confused", "error"],
  thinking: ["speaking", "happy", "confused", "idle", "error"],
  speaking: ["idle", "happy", "annoyed", "sleepy", "error"],
  happy: ["idle", "speaking", "listening", "error"],
  annoyed: ["idle", "listening", "speaking", "error"],
  sleepy: ["idle", "listening", "error"],
  confused: ["thinking", "speaking", "idle", "error"],
  error: ["idle"],
  hidden: ["peeking", "idle"],
  peeking: ["edge_sitting", "idle", "hidden"],
  edge_sitting: ["idle", "peeking", "hidden"]
};

export class AvatarStateMachine {
  private state: AvatarState;

  constructor(initialState: AvatarState = "idle") {
    this.state = initialState;
  }

  getState(): AvatarState {
    return this.state;
  }

  canTransition(nextState: AvatarState): boolean {
    return transitionMap[this.state].includes(nextState);
  }

  transition(nextState: AvatarState): AvatarState {
    if (!this.canTransition(nextState)) {
      throw new Error(`Invalid avatar transition: ${this.state} -> ${nextState}`);
    }

    this.state = nextState;
    return this.state;
  }

  force(nextState: AvatarState): AvatarState {
    this.state = nextState;
    return this.state;
  }
}
