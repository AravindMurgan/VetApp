import { describe, expect, it } from "vitest";
import { csvField, toCsv } from "./csv";

describe("csvField", () => {
  it("leaves a plain field unquoted", () => {
    expect(csvField("Bruno")).toBe("Bruno");
  });

  it("quotes a field containing a comma", () => {
    expect(csvField("Sharma, Priya")).toBe('"Sharma, Priya"');
  });

  it("quotes a field containing a double quote, doubling it", () => {
    expect(csvField('Rex "The Good Boy"')).toBe('"Rex ""The Good Boy"""');
  });

  it("quotes a field containing a newline", () => {
    expect(csvField("line one\nline two")).toBe('"line one\nline two"');
  });
});

describe("toCsv", () => {
  it("builds a header row plus data rows joined with CRLF", () => {
    const csv = toCsv(
      ["Name", "Phone"],
      [
        ["Bruno", "9876543210"],
        ["Sharma, Priya's cat", "9876500000"],
      ],
    );

    expect(csv).toBe(
      ["Name,Phone", 'Bruno,9876543210', '"Sharma, Priya\'s cat",9876500000'].join("\r\n"),
    );
  });
});
