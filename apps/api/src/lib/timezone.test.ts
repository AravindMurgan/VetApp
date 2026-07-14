import { describe, expect, it } from "vitest";
import { getLocalDateString, getTodayRangeUtc } from "./timezone";

describe("getTodayRangeUtc", () => {
  it("computes the correct UTC window for Asia/Kolkata (fixed UTC+5:30, no DST)", () => {
    // 2026-01-15T10:00:00Z is 2026-01-15 15:30 IST — same local calendar day.
    const now = new Date("2026-01-15T10:00:00.000Z");
    const { start, end } = getTodayRangeUtc("Asia/Kolkata", now);

    expect(start.toISOString()).toBe("2026-01-14T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-01-15T18:30:00.000Z");
  });

  it("computes the correct UTC window for Europe/London in winter (GMT, +0:00)", () => {
    // 2026-01-15T10:00:00Z is 2026-01-15 10:00 GMT — same local calendar day.
    const now = new Date("2026-01-15T10:00:00.000Z");
    const { start, end } = getTodayRangeUtc("Europe/London", now);

    expect(start.toISOString()).toBe("2026-01-15T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-01-16T00:00:00.000Z");
  });

  it("computes the correct UTC window for Europe/London in summer (BST, +1:00)", () => {
    // 2026-07-13T19:00:00Z is 2026-07-13 20:00 BST — same local calendar day.
    const now = new Date("2026-07-13T19:00:00.000Z");
    const { start, end } = getTodayRangeUtc("Europe/London", now);

    expect(start.toISOString()).toBe("2026-07-12T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-13T23:00:00.000Z");
  });

  it("computes a later local calendar day for Kolkata than London at the same instant", () => {
    // 2026-07-13T19:00:00Z is 2026-07-14 00:30 IST (already tomorrow locally)
    // but 2026-07-13 20:00 BST (still today locally) — a genuine boundary split.
    const now = new Date("2026-07-13T19:00:00.000Z");

    const kolkata = getTodayRangeUtc("Asia/Kolkata", now);
    const london = getTodayRangeUtc("Europe/London", now);

    expect(kolkata.start.toISOString()).toBe("2026-07-13T18:30:00.000Z");
    expect(kolkata.end.toISOString()).toBe("2026-07-14T18:30:00.000Z");
    expect(london.start.toISOString()).toBe("2026-07-12T23:00:00.000Z");
    expect(london.end.toISOString()).toBe("2026-07-13T23:00:00.000Z");
  });
});

describe("getLocalDateString", () => {
  it("formats the local calendar date for a given timezone", () => {
    const now = new Date("2026-07-13T19:00:00.000Z");
    expect(getLocalDateString("Asia/Kolkata", now)).toBe("2026-07-14");
    expect(getLocalDateString("Europe/London", now)).toBe("2026-07-13");
  });
});
