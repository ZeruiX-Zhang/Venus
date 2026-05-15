export type AvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "happy"
  | "confused"
  | "annoyed"
  | "sleepy"
  | "error"
  | "hidden"
  | "peeking"
  | "edge_sitting";

export type AvatarEventType =
  | "USER_TYPED"
  | "USER_SENT_MESSAGE"
  | "AGENT_THINKING"
  | "AGENT_RESPONDING"
  | "RESPONSE_FINISHED"
  | "MEMORY_RECALLED"
  | "MEMORY_SAVED"
  | "SAFETY_BLOCKED"
  | "TOOL_REQUESTED"
  | "ERROR"
  | "HIDE"
  | "PEEK"
  | "EDGE_SIT";

export interface AvatarRuntimeEvent {
  id: string;
  type: AvatarEventType;
  state: AvatarState;
  timestamp: string;
  message?: string;
}

export interface AvatarTransition {
  from: AvatarState;
  to: AvatarState;
  event: AvatarEventType;
}
