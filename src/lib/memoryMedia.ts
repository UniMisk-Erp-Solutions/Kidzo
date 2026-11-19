import type { Memory } from "@/lib/types/memory";

const imageMimeTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  heic: "image/heic",
  heif: "image/heif",
  jfif: "image/jpeg",
};

const videoMimeTypes: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export const MEMORY_IMAGE_ACCEPT = "image/*," + Object.keys(imageMimeTypes).map((ext) => "." + ext).join(",");
export const MEMORY_VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm,.mp4,.m4v,.mov,.webm";
export const MAX_MEMORY_VIDEO_MB = 50;
export const MAX_MEMORY_MEDIA = 10;

export const mediaExtension = (file: File) => /\.([a-z0-9]{1,10})$/i.exec(file.name)?.[1].toLowerCase();

function withMimeType(file: File, mimeType: string) {
  return file.type === mimeType ? file : new File([file], file.name, { type: mimeType, lastModified: file.lastModified });
}

export function prepareMemoryVideo(file: File): File {
  const mimeType = videoMimeTypes[mediaExtension(file) ?? ""] ?? (
    Object.values(videoMimeTypes).includes(file.type) ? file.type : undefined
  );
  if (!mimeType || file.size === 0) throw new Error("Choose a non-empty MP4, MOV, M4V or WebM video.");
  if (file.size > MAX_MEMORY_VIDEO_MB * 1_000_000) throw new Error(`Choose a video under ${MAX_MEMORY_VIDEO_MB} MB.`);
  return withMimeType(file, mimeType);
}

export function memoryPhotoSource(file: File): File {
  const mimeType = imageMimeTypes[mediaExtension(file) ?? ""] ?? file.type;
  if (!mimeType.startsWith("image/") || file.size === 0) throw new Error("Choose a non-empty image file.");
  return withMimeType(file, mimeType);
}

export async function prepareMemoryPhoto(source: File): Promise<File> {
  if (!/^image\/(?:heic|heif)(?:-sequence)?$/.test(source.type)) return source;
  const { heicTo } = await import("heic-to/csp");
  const jpeg = await heicTo({ blob: source, type: "image/jpeg", quality: 0.92 });
  return new File([jpeg], source.name.replace(/\.[^.]+$/, "") + ".jpg", {
    type: "image/jpeg",
    lastModified: source.lastModified,
  });
}

export type MemoryMediaKind = "photo" | "video";
export type MemoryMediaFile = { kind: MemoryMediaKind; file: File };
export type MemoryMedia = { kind: MemoryMediaKind; url: string; posterUrl?: string | null };

export function isMemoryVideo(file: File) {
  return file.type.startsWith("video/") || (mediaExtension(file) ?? "") in videoMimeTypes;
}

export function memoryMediaOf(memory: Memory): MemoryMedia[] {
  const photos = memory.photo_urls?.length ? memory.photo_urls : memory.photo_url ? [memory.photo_url] : [];
  const items: MemoryMedia[] = photos.map((url) => ({ kind: "photo", url }));
  const videos = Array.isArray(memory.video_items)
    ? memory.video_items.flatMap((value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return [];
        const { url, position, poster_url } = value;
        if (typeof url !== "string" || !url || typeof position !== "number" || !Number.isInteger(position) || position < 0) return [];
        return [{ url, position, poster_url: typeof poster_url === "string" ? poster_url : null }];
      }).sort((left, right) => left.position - right.position)
    : [];
  if (videos.length) {
    for (const { url, poster_url, position } of videos) {
      items.splice(position, 0, { kind: "video", url, posterUrl: poster_url });
    }
  } else if (memory.video_url) {
    items.push({ kind: "video", url: memory.video_url });
  }
  return items;
}

/** Capture a small frame when the device can decode the selected video. */
export async function makeVideoPoster(file: File): Promise<File | null> {
  const video = document.createElement("video");
  const url = URL.createObjectURL(file);
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  try {
    const ready = await new Promise<boolean>((resolve) => {
      const finish = (ok: boolean) => {
        clearTimeout(timeout);
        resolve(ok);
      };
      const timeout = setTimeout(() => finish(false), 3000);
      video.addEventListener("error", () => finish(false), { once: true });
      video.addEventListener("loadeddata", () => finish(true), { once: true });
      video.src = url + "#t=0.1";
    });
    if (!ready || !video.videoWidth || !video.videoHeight) return null;

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], "video-poster.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
