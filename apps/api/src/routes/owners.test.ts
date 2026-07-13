import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma-client";
import { signTestAccessToken } from "../test-utils/auth";

const app = createApp();
const authHeader = `Bearer ${signTestAccessToken()}`;
const createdOwnerIds: string[] = [];

describe("owners", () => {
  afterAll(async () => {
    await prisma.patient.deleteMany({ where: { ownerId: { in: createdOwnerIds } } });
    await prisma.owner.deleteMany({ where: { id: { in: createdOwnerIds } } });
  });

  it("creates an owner with a nested first patient", async () => {
    const response = await request(app)
      .post("/api/v1/owners")
      .set("Authorization", authHeader)
      .send({
        name: "Test Owner One",
        phone: "5551110001",
        patient: { name: "Bruno", species: "DOG" },
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Test Owner One");
    expect(response.body.patients).toHaveLength(1);
    expect(response.body.patients[0].name).toBe("Bruno");
    createdOwnerIds.push(response.body.id);
  });

  it("rejects a duplicate owner phone with 409", async () => {
    const first = await request(app)
      .post("/api/v1/owners")
      .set("Authorization", authHeader)
      .send({ name: "Dup One", phone: "5551110002", patient: { name: "Cat A", species: "CAT" } });
    createdOwnerIds.push(first.body.id);

    const response = await request(app)
      .post("/api/v1/owners")
      .set("Authorization", authHeader)
      .send({ name: "Dup Two", phone: "5551110002", patient: { name: "Cat B", species: "CAT" } });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("OWNER_PHONE_CONFLICT");
  });

  it("rejects requests without a valid access token", async () => {
    const response = await request(app)
      .post("/api/v1/owners")
      .send({ name: "No Auth", phone: "5551110003", patient: { name: "X", species: "DOG" } });

    expect(response.status).toBe(401);
  });

  it("fetches an owner by id with nested patients", async () => {
    const created = await request(app)
      .post("/api/v1/owners")
      .set("Authorization", authHeader)
      .send({
        name: "Fetchable Owner",
        phone: "5551110004",
        patient: { name: "Milo", species: "CAT" },
      });
    createdOwnerIds.push(created.body.id);

    const response = await request(app)
      .get(`/api/v1/owners/${created.body.id}`)
      .set("Authorization", authHeader);

    expect(response.status).toBe(200);
    expect(response.body.patients[0].name).toBe("Milo");
  });

  it("returns 404 for an unknown owner id", async () => {
    const response = await request(app)
      .get("/api/v1/owners/3fa85f64-5717-4562-b3fc-2c963f66afa6")
      .set("Authorization", authHeader);

    expect(response.status).toBe(404);
  });

  it("updates an owner", async () => {
    const created = await request(app)
      .post("/api/v1/owners")
      .set("Authorization", authHeader)
      .send({
        name: "Updatable Owner",
        phone: "5551110005",
        patient: { name: "Rex", species: "DOG" },
      });
    createdOwnerIds.push(created.body.id);

    const response = await request(app)
      .patch(`/api/v1/owners/${created.body.id}`)
      .set("Authorization", authHeader)
      .send({ notes: "Updated note" });

    expect(response.status).toBe(200);
    expect(response.body.notes).toBe("Updated note");
  });

  it("returns 405 for delete attempts (owners are never hard-deleted)", async () => {
    const created = await request(app)
      .post("/api/v1/owners")
      .set("Authorization", authHeader)
      .send({
        name: "Undeletable Owner",
        phone: "5551110006",
        patient: { name: "Fluffy", species: "CAT" },
      });
    createdOwnerIds.push(created.body.id);

    const response = await request(app)
      .delete(`/api/v1/owners/${created.body.id}`)
      .set("Authorization", authHeader);

    expect(response.status).toBe(405);
  });
});
