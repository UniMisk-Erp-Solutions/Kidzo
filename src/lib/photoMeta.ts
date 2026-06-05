import exifr from "exifr";

/**
 * Extracts the best "captured at" date from an image/video file.
 *
 * Order of preference:
 * 1. EXIF DateTimeOriginal / CreateDate / ModifyDate (images only)
 * 2. File.lastModified
 *
 * Returns null only if even lastModified is unavailable.
 */
export async function extractCapturedAt(file: File): Promise<Date | null> {
  // Try EXIF first for images
  if (file.type.startsWith("image/")) {
    try {
      const meta = await exifr.parse(file, {
        pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
      });
      const candidate =
        (meta?.DateTimeOriginal as Date | undefined) ??
        (meta?.CreateDate as Date | undefined) ??
        (meta?.ModifyDate as Date | undefined);
      if (candidate instanceof Date && !isNaN(candidate.getTime())) {
        return candidate;
      }
    } catch {
      // EXIF parsing can fail for many reasons (PNG, screenshots, edited files)
      // — fall through to lastModified.
    }
  }

  // Fall back to the file's last-modified timestamp
  if (file.lastModified) {
    const d = new Date(file.lastModified);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}
