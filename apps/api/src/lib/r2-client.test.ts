import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../errors/app-error";
import { createPresignedUpload } from "./r2-client";

describe("createPresignedUpload", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws a clear config error when R2 credentials are not set", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "");
    vi.stubEnv("R2_ACCESS_KEY_ID", "");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
    vi.stubEnv("R2_BUCKET_NAME", "");
    vi.stubEnv("R2_PUBLIC_URL", "");

    await expect(createPresignedUpload("case-1", "image/jpeg")).rejects.toMatchObject({
      status: 503,
      code: "STORAGE_NOT_CONFIGURED",
    } satisfies Partial<AppError>);
  });

  it("returns a presigned PUT url and public url scoped under the case id", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "test-account");
    vi.stubEnv("R2_ACCESS_KEY_ID", "test-access-key");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret-key");
    vi.stubEnv("R2_BUCKET_NAME", "test-bucket");
    vi.stubEnv("R2_PUBLIC_URL", "https://pub-example.r2.dev");

    const result = await createPresignedUpload("case-1", "image/png");

    expect(result.uploadUrl).toContain("test-account.r2.cloudflarestorage.com");
    expect(result.uploadUrl).toContain("test-bucket");
    expect(result.publicUrl).toMatch(/^https:\/\/pub-example\.r2\.dev\/cases\/case-1\/[\w-]+\.png$/);
  });
});
