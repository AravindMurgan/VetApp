import { z } from "zod";

export const attachmentContentTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);
export type AttachmentContentType = z.infer<typeof attachmentContentTypeSchema>;

/** Body for POST /cases/:id/attachments — kicks off a presigned R2 upload. */
export const attachmentUploadRequestSchema = z.object({
  contentType: attachmentContentTypeSchema,
});
export type AttachmentUploadRequest = z.infer<typeof attachmentUploadRequestSchema>;

export const attachmentUploadResponseSchema = z.object({
  attachmentId: z.string().uuid(),
  uploadUrl: z.string(),
  url: z.string(),
});
export type AttachmentUploadResponse = z.infer<typeof attachmentUploadResponseSchema>;

export const attachmentResponseSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  url: z.string(),
  thumbUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type AttachmentResponse = z.infer<typeof attachmentResponseSchema>;
