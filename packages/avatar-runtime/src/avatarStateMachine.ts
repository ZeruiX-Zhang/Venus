import type {
  AvatarEventType,
  AvatarRuntimeEvent,
  AvatarState,
  AvatarTransition
} from "./types";

const transitionByEvent: Record<AvatarEventType, AvatarState> = {
  USER_TYPED: "listening",
  USER_SENT_MESSAGE: "thinking",
  AGENT_THINKING: "thinking",
  AGENT_RESPONDING: "speaking",
  RESPONSE_FINISHED: "idle",
  MEMORY_RECALLED: "happy",
  MEMORY_SAVED: "happy",
  SAFETY_BLOCKED: "confused",
  TOOL_REQUESTED: "thinking",
  ERROR: "error",
  HIDE: "hidden",
  PEEK: "peeking",
  EDGE_SIT: "edge_sitting"
};

const makeId = (): string => `avatar_${Math.random().toString(36).slice(2, 10)}`;

export class AvatarStateMachine {
  private state: AvatarState;
  private readonly history: AvatarRuntimeEvent[] = [];
  private readonly transitions: AvatarTransition[] = [];

  constructor(initialState: AvatarState = "idle") {
    this.state = initialState;
  }

  current(): AvatarState {
    return this.state;
  }

  dispatch(type: AvatarEventType, message?: string): AvatarRuntimeEvent {
    const from = this.state;
    const to = transitionByEvent[type];
    this.state = to;
    this.transitions.unshift({ from, to, event: type });
    this.transitions.splice(80);

    const event: AvatarRuntimeEvent = {
      id: makeId(),
      type,
      state: to,
      timestamp: new Date().toISOString(),
      ...(message ? { message } : {})
    };
    this.history.unshift(event);
    this.history.splice(80);
    return event;
  }

  force(state: AvatarState, message?: string): AvatarRuntimeEvent {
    const from = this.state;
    this.state = state;
    this.transitions.unshift({ from, to: state, event: stateToEvent(state) });
    const event: AvatarRuntimeEvent = {
      id: makeId(),
      type: stateToEvent(state),
      state,
      timestamp: new Date().toISOString(),
      ...(message ? { message } : {})
    };
    this.history.unshift(event);
    return event;
  }

  listEvents(): AvatarRuntimeEvent[] {
    return this.history.map((event) => ({ ...event }));
  }

  listTransitions(): AvatarTransition[] {
    return this.transitions.map((transition) => ({ ...transition }));
  }
}

export class AvatarRuntime extends AvatarStateMachine {}

export const renderPixelAvatar = (
  state: AvatarState,
  caption = ""
): string => {
  const eyes = {
    idle: "o o",
    listening: "^ ^",
    thinking: "- -",
    speaking: "o O",
    happy: "^ ^",
    confused: "? ?",
    annoyed: "> <",
    sleepy: "- -",
    error: "x x",
    hidden: ". .",
    peeking: "o .",
    edge_sitting: "u u"
  } satisfies Record<AvatarState, string>;
  const mouth = state === "happy" ? "w" : state === "speaking" ? "o" : state === "annoyed" ? "_" : ".";
  return [
    "  /\\_/\\",
    ` ( ${eyes[state]} )`,
    `  > ${mouth} <   ${state}${caption ? ` - ${caption}` : ""}`,
    " /|___|\\"
  ].join("\n");
};

const stateToEvent = (state: AvatarState): AvatarEventType => {
  if (state === "hidden") {
    return "HIDE";
  }
  if (state === "peeking") {
    return "PEEK";
  }
  if (state === "edge_sitting") {
    return "EDGE_SIT";
  }
  if (state === "error") {
    return "ERROR";
  }
  if (state === "speaking") {
    return "AGENT_RESPONDING";
  }
  if (state === "thinking") {
    return "AGENT_THINKING";
  }
  return "RESPONSE_FINISHED";
};
