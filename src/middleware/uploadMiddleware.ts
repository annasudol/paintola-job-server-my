import multer from "multer"

/**
 * Multer configuration for uploading remix images.
 * Uses in-memory storage and limits file size to 20MB.
 */

export const remixUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 20MB limit
}).single("image_file")
