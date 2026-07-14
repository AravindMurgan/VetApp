import { describe, expect, it } from "vitest";
import { attachmentUploadRequestSchema, attachmentResponseSchema } from "./attachment";

const VALID_UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("attachmentUploadRequestSchema", () => {
  it("accepts an allowed image content type", () => {
    const result = attachmentUploadRequestSchema.safeParse({ contentType: "image/jpeg" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-image content type", () => {
    const result = attachmentUploadRequestSchema.safeParse({ contentType: "text/plain" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing content type", () => {
    const result = attachmentUploadRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("attachmentResponseSchema", () => {
  it("accepts a full attachment record", () => {
    const result = attachmentResponseSchema.safeParse({
      id: VALID_UUID,
      caseId: VALID_UUID,
      url: "https://pub-example.r2.dev/cases/x/photo.jpg",
      thumbUrl: "https://pub-example.r2.dev/cases/x/photo.jpg",
      createdAt: "2026-07-14T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a null thumbUrl", () => {
    const result = attachmentResponseSchema.safeParse({
      id: VALID_UUID,
      caseId: VALID_UUID,
      url: "https://pub-example.r2.dev/cases/x/photo.jpg",
      thumbUrl: null,
      createdAt: "2026-07-14T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});
