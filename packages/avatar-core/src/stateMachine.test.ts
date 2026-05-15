import { describe, expect, it } from "vitest";
import { AvatarStateMachine } from "./stateMachine";

describe("AvatarStateMachine", () => {
  it("allows expected companion state transitions", () => {
    const machine = new AvatarStateMachine();

    expect(machine.getState()).toBe("idle");
    expect(machine.transition("listening")).toBe("listening");
    expect(machine.transition("thinking")).toBe("thinking");
    expect(machine.transition("speaking")).toBe("speaking");
    expect(machine.transition("happy")).toBe("happy");
    expect(machine.transition("idle")).toBe("idle");
  });

  it("rejects invalid recovery transitions", () => {
    const machine = new AvatarStateMachine("error");

    expect(() => machine.transition("speaking")).toThrow(
      "Invalid avatar transition"
    );
    expect(machine.transition("idle")).toBe("idle");
  });
});
