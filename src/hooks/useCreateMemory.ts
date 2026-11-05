import { supabase } from "@/integrations/supabase/client";

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
  /** Photos in upload order (the highlight first). */
  photos: File[];
  /** Siblings whose timeline this memory is also added to, each with an optional relation note. */
  links: { childId: string; label: string }[];
};

export type CreateMemoryResult =
  | { ok: false; message: string }
  | { ok: true; linkCount: number; linkError: string | null };

/** Uploads the photos in order and returns their public URLs, or null if any upload fails. */
async function uploadPhotos(userId: string, files: File[]): Promise<string[] | null> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("memory-photos").upload(path, file, { contentType: file.type });
    if (error) return null;
    urls.push(supabase.storage.from("memory-photos").getPublicUrl(path).data.publicUrl);
  }
  return urls;
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
  const urls = await uploadPhotos(input.userId, input.photos);
  if (!urls) return { ok: false, message: "Couldn't upload one of your photos. Please try again." };

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
      reaction: input.reaction.trim() || null,
    })
    .select("id")
    .single();
  if (error || !inserted) return { ok: false, message: error?.message ?? "Couldn't save this memory. Please try again." };

  const linkError = await linkSiblings(inserted.id, input.links);
  return { ok: true, linkCount: input.links.length, linkError };
}

/** Saving a new memory (photos, the memory itself and sibling links), so pages never talk to the database directly. */
export const useCreateMemory = () => createMemory;
