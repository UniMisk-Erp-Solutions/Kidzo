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

type UploadedMedia = { urls: string[]; videoItems: { url: string; poster_url: string | null; position: number }[] };

/** Uploads every photo and video (plus video posters), recording each stored path so a failure can clean up. */
async function uploadAllMedia(userId: string, media: MemoryMediaFile[], paths: string[]): Promise<UploadedMedia> {
  const uploaded: UploadedMedia = { urls: [], videoItems: [] };
  for (const [position, item] of media.entries()) {
    const url = await uploadMedia(userId, item.file, paths);
    if (item.kind === "photo") {
      uploaded.urls.push(url);
      continue;
    }
    const poster = await makeVideoPoster(item.file);
    const posterUrl = poster ? await uploadMedia(userId, poster, paths) : null;
    uploaded.videoItems.push({ url, poster_url: posterUrl, position });
  }
  return uploaded;
}

const removeUploaded = async (paths: string[]) => {
  if (paths.length) await memoryMedia().remove(paths);
};

async function createMemory(input: NewMemoryInput): Promise<CreateMemoryResult> {
  if (input.media.length > MAX_MEMORY_MEDIA) return { ok: false, message: "A memory can have up to 10 photos and videos combined." };
  const paths: string[] = [];
  let uploaded: UploadedMedia;
  try {
    uploaded = await uploadAllMedia(input.userId, input.media, paths);
  } catch (error) {
    await removeUploaded(paths);
    const reason = error instanceof Error ? error.message : "Please try again.";
    return { ok: false, message: `Couldn't upload your media. ${reason}` };
  }
  const { urls, videoItems } = uploaded;

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
    await removeUploaded(paths);
    return { ok: false, message: error?.message ?? "Couldn't save this memory. Please try again." };
  }

  const linkError = await linkSiblings(inserted.id, input.links);
  return { ok: true, linkCount: input.links.length, linkError };
}

/** Saving a new memory (photos, the memory itself and sibling links), so pages never talk to the database directly. */
export const useCreateMemory = () => createMemory;
