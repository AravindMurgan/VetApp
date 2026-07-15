import { describe, expect, it } from "vitest";
import { formatVitals } from "./format-vitals";

describe("formatVitals", () => {
  it("returns null when nothing was recorded", () => {
    expect(formatVitals({ temperatureC: null, heartRate: null, respRate: null })).toBeNull();
  });

  it("formats all four values in order", () => {
    expect(
      formatVitals({ temperatureC: "38.5", heartRate: 120, respRate: 24, weightKg: "12.40" }),
    ).toBe("38.5°C · HR 120 · RR 24 · 12.4 kg");
  });

  it("omits values that were not recorded", () => {
    expect(formatVitals({ temperatureC: "38.5", heartRate: null, respRate: null })).toBe("38.5°C");
  });

  it("omits weight when not provided", () => {
    expect(formatVitals({ temperatureC: null, heartRate: 90, respRate: null })).toBe("HR 90");
  });
});
