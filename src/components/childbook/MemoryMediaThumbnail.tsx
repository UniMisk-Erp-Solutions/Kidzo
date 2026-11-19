import type { MemoryMedia } from "@/lib/memoryMedia";

export function MemoryMediaThumbnail({ item, alt, className }: { item: MemoryMedia; alt: string; className: string }) {
  if (item.kind === "video" && !item.posterUrl) {
    return <video src={item.url + "#t=0.1"} className={className} muted playsInline preload="metadata" aria-hidden="true" />;
  }
  return <img src={item.posterUrl ?? item.url} alt={alt} className={className} loading="lazy" />;
}
