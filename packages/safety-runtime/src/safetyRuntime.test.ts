import { describe, expect, it } from "vitest";
import {
  createDefaultSafetyProfile,
  evaluateIdentityPolicy,
  evaluateInputSafety,
  evaluateOutputSafety,
  filterDebugInfoForMode,
  getSafetyModeDisplay,
  setSafetyMode
} from "./index";

describe("Safety Runtime", () => {
  it("blocks sexual content in minor mode without depending on persona cores", () => {
    const profile = createDefaultSafetyProfile("minor");
    const result = evaluateInputSafety("Write a sexy explicit scene", profile);

    expect(result.allowed).toBe(false);
    expect(result.forcedPersonaCoreIds).toEqual([]);
    expect(result.safeRedirect).toContain("non-explicit");
  });

  it("returns localized safety mode display names", () => {
    expect(getSafetyModeDisplay("minor", "zh-CN")).toBe("未成年人安全模式");
    expect(getSafetyModeDisplay("strict", "zh")).toBe("严格模式");
    expect(getSafetyModeDisplay("adult", "en")).toBe("Adult mode");
  });

  it("blocks graphic violence and gore in minor mode", () => {
    const profile = createDefaultSafetyProfile("minor");
    const result = evaluateInputSafety("Describe gore with viscera and torture", profile);

    expect(result.allowed).toBe(false);
    expect(result.auditTags).toEqual(expect.arrayContaining(["graphic_violence", "gore"]));
  });

  it("allows normal chat in adult mode", () => {
    const profile = createDefaultSafetyProfile("adult");
    const result = evaluateInputSafety("Can you help me plan tomorrow?", profile);

    expect(result.allowed).toBe(true);
  });

  it("evaluates identity role limits", () => {
    const profile = createDefaultSafetyProfile("adult");
    const limited = evaluateIdentityPolicy("professional_role_limited", profile);
    const forbidden = evaluateIdentityPolicy("forbidden_identity", profile);

    expect(limited.allowed).toBe(true);
    expect(limited.safeRedirect).toContain("general information");
    expect(forbidden.allowed).toBe(false);
  });

  it("hides developer debug in normal mode", () => {
    expect(filterDebugInfoForMode({ traceId: "trace_1" }, false)).toBeUndefined();
    expect(filterDebugInfoForMode({ traceId: "trace_1" }, true)?.traceId).toBe("trace_1");
  });

  it("blocks runtime leakage in normal output", () => {
    const profile = setSafetyMode(createDefaultSafetyProfile("adult"), "minor");
    const result = evaluateOutputSafety("traceId and provider config are visible", profile, false);

    expect(result.allowed).toBe(false);
    expect(result.reasons.join(" ")).toContain("Developer");
  });
});
