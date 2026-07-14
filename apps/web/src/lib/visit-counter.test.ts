import { beforeEach, describe, expect, it } from "vitest";
import { recordVisit } from "./visit-counter";

describe("recordVisit", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("returns 1 on the first ever visit", () => {
    expect(recordVisit()).toBe(1);
  });

  it("does not increment again within the same session", () => {
    expect(recordVisit()).toBe(1);
    expect(recordVisit()).toBe(1);
    expect(recordVisit()).toBe(1);
  });

  it("increments across separate sessions", () => {
    expect(recordVisit()).toBe(1);
    window.sessionStorage.clear();
    expect(recordVisit()).toBe(2);
    window.sessionStorage.clear();
    expect(recordVisit()).toBe(3);
  });
});
