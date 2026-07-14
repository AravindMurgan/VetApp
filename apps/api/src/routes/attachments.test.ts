import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma-client";
import { signTestAccessToken } from "../test-utils/auth";

const createPresignedUploadMock = vi.fn();
vi.mock("../lib/r2-client", () => ({
  createPresignedUpload: (...args: unknown[]) => createPresignedUploadMock(...args),
}));

const app = createApp();
const authHeader = `Bearer ${signTestAccessToken()}`;
const createdOwnerIds: string[] = [];

describe("POST /cases/:id/attachments", () => {
  let patientId: string;
  let caseId: string;

  beforeAll(async () => {
    const owner = await prisma.owner.create({
      data: {
        name: "Attachment Test Owner",
        phone: "5557770001",
        patients: { create: { name: "Attachment Test Pet", species: "DOG" } },
      },
      include: { patients: true },
    });
    createdOwnerIds.push(owner.id);
    patientId = owner.patients[0]!.id;

    const createdCase = await prisma.case.create({ data: { patientId, type: "CONSULTATION" } });
    caseId = createdCase.id;
  });

  afterAll(async () => {
    await prisma.attachment.deleteMany({ where: { case: { patientId } } });
    await prisma.case.deleteMany({ where: { patientId } });
    await prisma.patient.deleteMany({ where: { ownerId: { in: createdOwnerIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: createdOwnerIds } } });
  });

  it("rejects requests without a valid access token", async () => {
    const response = await request(app)
      .post(`/api/v1/cases/${caseId}/attachments`)
      .send({ contentType: "image/jpeg" });

    expect(response.status).toBe(401);
  });

  it("rejects a non-image content type", async () => {
    const response = await request(app)
      .post(`/api/v1/cases/${caseId}/attachments`)
      .set("Authorization", authHeader)
      .send({ contentType: "text/plain" });

    expect(response.status).toBe(400);
  });

  it("rejects a missing content type", async () => {
    const response = await request(app)
      .post(`/api/v1/cases/${caseId}/attachments`)
      .set("Authorization", authHeader)
      .send({});

    expect(response.status).toBe(400);
  });

  it("returns 404 for an unknown case id", async () => {
    // The service checks the case exists before calling createPresignedUpload,
    // so the mock is never invoked here — no need to queue a resolved value.
    const response = await request(app)
      .post("/api/v1/cases/3fa85f64-5717-4562-b3fc-2c963f66afa6/attachments")
      .set("Authorization", authHeader)
      .send({ contentType: "image/jpeg" });

    expect(response.status).toBe(404);
    expect(createPresignedUploadMock).not.toHaveBeenCalled();
  });

  it("creates an Attachment row and returns a presigned upload URL", async () => {
    createPresignedUploadMock.mockResolvedValueOnce({
      uploadUrl: "https://example-bucket.r2.cloudflarestorage.com/presigned",
      publicUrl: `https://pub-example.r2.dev/cases/${caseId}/photo.jpg`,
    });

    const response = await request(app)
      .post(`/api/v1/cases/${caseId}/attachments`)
      .set("Authorization", authHeader)
      .send({ contentType: "image/jpeg" });

    expect(response.status).toBe(201);
    expect(response.body.uploadUrl).toBe("https://example-bucket.r2.cloudflarestorage.com/presigned");
    expect(response.body.url).toBe(`https://pub-example.r2.dev/cases/${caseId}/photo.jpg`);
    expect(createPresignedUploadMock).toHaveBeenCalledWith(caseId, "image/jpeg");

    const attachment = await prisma.attachment.findUnique({ where: { id: response.body.attachmentId } });
    expect(attachment).not.toBeNull();
    expect(attachment?.caseId).toBe(caseId);
    expect(attachment?.url).toBe(`https://pub-example.r2.dev/cases/${caseId}/photo.jpg`);
  });
});
