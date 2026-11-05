import { supabase } from "@/integrations/supabase/client";

/** Fields the memory editor can change. */
export interface MemoryEditFields {
  title: string;
  story: string;
  happenedAt: Date;
  category: string;
  who: string[];
  tags: string[];
}

export interface SaveMemoryInput {
  userId: string;
  memoryId: string;
  fields: MemoryEditFields;
  keptUrls: string[];
  newFiles: File[];
  highlightIdx: number;
}

export interface SaveMemoryResult {
  ok: boolean;
  message: string;
  photoUrls: string[];
}

/** Deletes a memory; returns an error message, or null on success. */
export const deleteMemoryRow = async (id: string): Promise<string | null> => {
  const { error } = await supabase.from("memories").delete().eq("id", id);
  return error ? error.message : null;
};

const uploadPhoto = async (userId: string, file: File): Promise<string | null> => {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("memory-photos").upload(path, file, { contentType: file.type });
  if (error) return null;
  return supabase.storage.from("memory-photos").getPublicUrl(path).data.publicUrl;
};

/** Kept photos then new ones, with the highlighted one moved to the front. */
export const orderWithHighlight = (combined: string[], highlightIdx: number): string[] => {
  if (combined.length === 0) return [];
  const safe = Math.min(Math.max(0, highlightIdx), combined.length - 1);
  return [combined[safe], ...combined.filter((_, i) => i !== safe)];
};

/** Uploads the new photos, then writes the edited memory. */
export const saveMemoryEdit = async (input: SaveMemoryInput): Promise<SaveMemoryResult> => {
  const uploaded: string[] = [];
  for (const file of input.newFiles) {
    const url = await uploadPhoto(input.userId, file);
    if (!url) return { ok: false, message: "Couldn't upload a photo. Please try again.", photoUrls: [] };
    uploaded.push(url);
  }
  const ordered = orderWithHighlight([...input.keptUrls, ...uploaded], input.highlightIdx);
  const { fields } = input;
  const { error } = await supabase
    .from("memories")
    .update({
      title: fields.title.trim(),
      story: fields.story.trim() || null,
      happened_at: fields.happenedAt.toISOString(),
      category: fields.category,
      who_was_there: fields.who,
      tags: fields.tags,
      photo_url: ordered[0] ?? null,
      photo_urls: ordered,
    })
    .eq("id", input.memoryId);
  return error ? { ok: false, message: error.message, photoUrls: [] } : { ok: true, message: "", photoUrls: ordered };
};
