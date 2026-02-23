import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "payperplay";

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Generate a presigned URL for uploading a file directly from the browser.
 * The URL is valid for 1 hour.
 */
export async function getPresignedUploadUrl(params: {
  key: string;
  contentType: string;
  maxSizeBytes?: number;
}): Promise<{ url: string; key: string }> {
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: params.key,
    ContentType: params.contentType,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 3600 });

  return { url, key: params.key };
}

/**
 * Generate a presigned URL for reading/streaming a file.
 * Used to serve paid content — URL expires so it can't be shared.
 */
export async function getPresignedReadUrl(params: {
  key: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: params.key,
  });

  return getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds || 3600, // 1 hour default
  });
}

/**
 * Delete a file from R2.
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Generate a unique storage key for a content upload.
 * Format: content/{creatorId}/{contentId}/{timestamp}-{filename}
 */
export function generateStorageKey(params: {
  creatorId: string;
  fileName: string;
  mediaType: "video" | "thumbnail" | "avatar";
}): string {
  const timestamp = Date.now();
  const sanitized = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${params.mediaType}/${params.creatorId}/${timestamp}-${sanitized}`;
}

// Max file sizes
export const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB
export const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
];

export const ALLOWED_THUMBNAIL_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
