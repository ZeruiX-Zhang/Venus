import type { AvatarEventType, AvatarState } from "./types";

export interface AvatarMotionSpec {
  state: AvatarState;
  label: string;
  breathingSeconds: number;
  floatPixels: number;
  particleLevel: 0 | 1 | 2 | 3;
  expression: "neutral" | "smile" | "open" | "flat" | "sleep" | "worry" | "error";
}

export const avatarMotions: Record<AvatarState, AvatarMotionSpec> = {
  idle: {
    state: "idle",
    label: "Idle breathing",
    breathingSeconds: 3.6,
    floatPixels: 8,
    particleLevel: 0,
    expression: "neutral"
  },
  listening: {
    state: "listening",
    label: "Focused listening",
    breathingSeconds: 2.8,
    floatPixels: 6,
    particleLevel: 1,
    expression: "neutral"
  },
  thinking: {
    state: "thinking",
    label: "Thinking particles",
    breathingSeconds: 1.8,
    floatPixels: 10,
    particleLevel: 2,
    expression: "worry"
  },
  speaking: {
    state: "speaking",
    label: "Speaking pulse",
    breathingSeconds: 1.05,
    floatPixels: 9,
    particleLevel: 2,
    expression: "open"
  },
  happy: {
    state: "happy",
    label: "Happy sparkle",
    breathingSeconds: 2.4,
    floatPixels: 12,
    particleLevel: 3,
    expression: "smile"
  },
  confused: {
    state: "confused",
    label: "Confused tilt",
    breathingSeconds: 2.2,
    floatPixels: 5,
    particleLevel: 1,
    expression: "worry"
  },
  annoyed: {
    state: "annoyed",
    label: "Annoyed glance",
    breathingSeconds: 2.1,
    floatPixels: 4,
    particleLevel: 0,
    expression: "flat"
  },
  sleepy: {
    state: "sleepy",
    label: "Sleepy sway",
    breathingSeconds: 4.4,
    floatPixels: 5,
    particleLevel: 0,
    expression: "sleep"
  },
  error: {
    state: "error",
    label: "Error flicker",
    breathingSeconds: 0.9,
    floatPixels: 2,
    particleLevel: 1,
    expression: "error"
  },
  hidden: {
    state: "hidden",
    label: "Hidden",
    breathingSeconds: 4,
    floatPixels: 0,
    particleLevel: 0,
    expression: "neutral"
  },
  peeking: {
    state: "peeking",
    label: "Peeking",
    breathingSeconds: 3,
    floatPixels: 4,
    particleLevel: 1,
    expression: "neutral"
  },
  edge_sitting: {
    state: "edge_sitting",
    label: "Edge sitting",
    breathingSeconds: 3.2,
    floatPixels: 5,
    particleLevel: 1,
    expression: "smile"
  }
};

export const avatarEventLabels: Record<AvatarEventType, string> = {
  USER_TYPED: "User typed",
  USER_SENT_MESSAGE: "User sent message",
  AGENT_THINKING: "Agent thinking",
  AGENT_RESPONDING: "Agent responding",
  RESPONSE_FINISHED: "Response finished",
  MEMORY_RECALLED: "Memory recalled",
  MEMORY_SAVED: "Memory saved",
  SAFETY_BLOCKED: "Safety blocked",
  TOOL_REQUESTED: "Tool requested",
  ERROR: "Error",
  HIDE: "Hide",
  PEEK: "Peek",
  EDGE_SIT: "Edge sit"
};
