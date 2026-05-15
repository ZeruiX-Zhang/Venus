import { describe, expect, it } from "vitest";
import { AvatarRuntime, renderPixelAvatar } from "./index";

describe("Avatar Runtime", () => {
  it("maps runtime events into real-time-feeling avatar states", () => {
    const runtime = new AvatarRuntime();

    expect(runtime.dispatch("USER_SENT_MESSAGE").state).toBe("thinking");
    expect(runtime.dispatch("AGENT_RESPONDING").state).toBe("speaking");
    expect(runtime.dispatch("MEMORY_RECALLED").state).toBe("happy");
    expect(runtime.dispatch("RESPONSE_FINISHED").state).toBe("idle");
  });

  it("supports hidden, peeking, and edge sitting states", () => {
    const runtime = new AvatarRuntime();

    expect(runtime.dispatch("PEEK").state).toBe("peeking");
    expect(runtime.dispatch("EDGE_SIT").state).toBe("edge_sitting");
    expect(runtime.dispatch("HIDE").state).toBe("hidden");
  });

  it("renders a CLI pixel companion", () => {
    expect(renderPixelAvatar("thinking", "working")).toContain("thinking - working");
  });
});
