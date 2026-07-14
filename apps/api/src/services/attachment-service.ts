import type { AttachmentContentType } from "@vetlog/shared";
import { prisma } from "../lib/prisma-client";
import { AppError } from "../errors/app-error";
import { createPresignedUpload } from "../lib/r2-client";

export async function createAttachmentUpload(caseId: string, contentType: AttachmentContentType) {
  const foundCase = await prisma.case.findUnique({ where: { id: caseId } });
  if (!foundCase) {
    throw new AppError(404, "CASE_NOT_FOUND", "Case not found");
  }

  const { uploadUrl, publicUrl } = await createPresignedUpload(caseId, contentType);

  const attachment = await prisma.attachment.create({
    data: { caseId, url: publicUrl, thumbUrl: publicUrl },
  });

  return { attachmentId: attachment.id, uploadUrl, url: publicUrl };
}
