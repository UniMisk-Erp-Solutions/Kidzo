import { supabase } from "@/integrations/supabase/client";
import { makeVideoPoster, MAX_MEMORY_MEDIA, mediaExtension, type MemoryMediaFile } from "@/lib/memoryMedia";

export type NewMemoryInput = {
  userId: string;
  childId: string;
  title: string;
  story: string;
  happenedAt: Date;
  category: string;
  who: string[];
  tags: string[];
  reaction: string;
  /** Photos and videos in display order, with the highlight first. */
  media: MemoryMediaFile[];
  /** Siblings whose timeline this memory is also added to, each with an optional relation note. */
  links: { childId: string; label: string }[];
};

export type CreateMemoryResult =
  | { ok: false; message: string }
  | { ok: true; linkCount: number; linkError: string | null };

const memoryMedia = () => supabase.storage.from("memory-photos");

async function uploadMedia(userId: string, file: File, paths: string[]) {
  const extension = mediaExtension(file);
  const path = `${userId}/${crypto.randomUUID()}${extension ? "." + extension : ""}`;
  const bucket = memoryMedia();
  const { error } = await bucket.upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  paths.push(path);
  return bucket.getPublicUrl(path).data.publicUrl;
}

/** Also places the memory on the chosen siblings' timelines (additive links). Returns an error message, if any. */
async function linkSiblings(memoryId: string, links: NewMemoryInput["links"]): Promise<string | null> {
  if (links.length === 0) return null;
  const rows = links.map((l) => ({
    memory_id: memoryId,
    child_id: l.childId,
    relation_label: (l.label || "").trim() || null,
  }));
  const { error } = await supabase.from("memory_child_links").insert(rows);
  return error ? error.message : null;
}

async function createMemory(input: NewMemoryInput): Promise<CreateMemoryResult> {
  const paths: string[] = [];
  const urls: string[] = [];
  if (input.media.length > MAX_MEMORY_MEDIA) return { ok: false, message: "A memory can have up to 10 photos and videos combined." };
  const videoItems: { url: string; poster_url: string | null; position: number }[] = [];
  try {
    for (const [position, item] of input.media.entries()) {
      const url = await uploadMedia(input.userId, item.file, paths);
      if (item.kind === "photo") {
        urls.push(url);
      } else {
        const poster = await makeVideoPoster(item.file);
        const posterUrl = poster ? await uploadMedia(input.userId, poster, paths) : null;
        videoItems.push({ url, poster_url: posterUrl, position });
      }
    }
  } catch (error) {
    if (paths.length) await memoryMedia().remove(paths);
    const reason = error instanceof Error ? error.message : "Please try again.";
    return { ok: false, message: `Couldn't upload your media. ${reason}` };
  }

  const { data: inserted, error } = await supabase
    .from("memories")
    .insert({
      user_id: input.userId,
      child_id: input.childId,
      title: input.title.trim(),
      story: input.story.trim() || null,
      happened_at: input.happenedAt.toISOString(),
      category: input.category,
      who_was_there: input.who,
      tags: input.tags,
      photo_url: urls[0] ?? null,
      photo_urls: urls,
      ...(videoItems.length ? { video_items: videoItems } : {}),
      reaction: input.reaction.trim() || null,
    })
    .select("id")
    .single();
  if (error || !inserted) {
    if (paths.length) await memoryMedia().remove(paths);
    return { ok: false, message: error?.message ?? "Couldn't save this memory. Please try again." };
  }

  const linkError = await linkSiblings(inserted.id, input.links);
  return { ok: true, linkCount: input.links.length, linkError };
}

/** Saving a new memory (photos, the memory itself and sibling links), so pages never talk to the database directly. */
export const useCreateMemory = () => createMemory;
