import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "../errors/app-error";

const PRESIGNED_URL_TTL_SECONDS = 5 * 60;

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

function readConfig(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

let cachedClient: S3Client | null = null;

function getClient(config: R2Config): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }
  return cachedClient;
}

export interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
}

/**
 * Presigned PUT URL for a case photo, scoped under `cases/:caseId/` in the
 * bucket. Throws a clear config error rather than crashing at import time —
 * R2 credentials are optional in local dev (see .env.example).
 */
export async function createPresignedUpload(
  caseId: string,
  contentType: string,
): Promise<PresignedUpload> {
  const config = readConfig();
  if (!config) {
    throw new AppError(503, "STORAGE_NOT_CONFIGURED", "Photo storage is not configured");
  }

  const extension = CONTENT_TYPE_EXTENSIONS[contentType] ?? "bin";
  const key = `cases/${caseId}/${randomUUID()}.${extension}`;

  const client = getClient(config);
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: PRESIGNED_URL_TTL_SECONDS });

  return { uploadUrl, publicUrl: `${config.publicUrl}/${key}` };
}
