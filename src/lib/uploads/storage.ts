import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

/**
 * Validates and saves an uploaded PDF or image into `uploads/<category>/`
 * and returns its relative POSIX path (e.g. `bmdc/17322100-abc.pdf`).
 */
export async function saveUploadedFile(
  file: File,
  category: "bmdc" | "prescriptions"
): Promise<string> {
  if (!file || file.size === 0) {
    throw new UploadValidationError("Uploaded file is empty.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError(
      "File size exceeds the 5 MB maximum limit."
    );
  }

  const ext = ALLOWED_MIME_TO_EXT[file.type];
  if (!ext) {
    throw new UploadValidationError(
      "Only PDF, JPG, PNG, and WEBP files are allowed."
    );
  }

  const targetDir = path.join(UPLOADS_ROOT, category);
  await fs.mkdir(targetDir, { recursive: true });

  const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const fullPath = path.join(targetDir, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(fullPath, buffer);

  return `${category}/${uniqueName}`;
}

export function resolveSafeUploadPath(relativePath: string): {
  fullPath: string;
  mimeType: string;
} {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    normalized.includes("..") ||
    (!normalized.startsWith("bmdc/") &&
      !normalized.startsWith("prescriptions/"))
  ) {
    throw new UploadValidationError("Invalid upload file path.");
  }

  const fullPath = path.resolve(UPLOADS_ROOT, normalized);
  if (!fullPath.startsWith(UPLOADS_ROOT)) {
    throw new UploadValidationError("Path traversal blocked.");
  }

  const ext = path.extname(fullPath).toLowerCase();
  const mimeType =
    ext === ".pdf"
      ? "application/pdf"
      : ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";

  return { fullPath, mimeType };
}
