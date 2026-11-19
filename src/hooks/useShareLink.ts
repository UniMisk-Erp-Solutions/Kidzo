import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { shareOrEmail } from "@/lib/shareLink";
import { newShareToken } from "@/lib/exportShareHelpers";

interface ShareChild {
  id: string;
  name: string;
}

/** Uploads the PDF under the user's folder and registers a random public token for it. */
const storeKeepsake = async (blob: Blob, userId: string, childId: string): Promise<string> => {
  // The file name is random (no child name or ids). The folder must stay the user id for the storage
  // policy, but that path is never put in the link: the link is just a random token on our own domain.
  const path = `${userId}/${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage
    .from("shared-keepsakes")
    .upload(path, blob, { contentType: "application/pdf", upsert: false });
  if (error) throw error;
  const token = newShareToken();
  const { error: linkError } = await supabase
    .from("shared_keepsakes")
    .insert({ token, user_id: userId, child_id: childId, storage_path: path });
  if (linkError) {
    await supabase.storage.from("shared-keepsakes").remove([path]);
    throw linkError;
  }
  return token;
};

/** Public share link for the finished PDF, plus the phone share sheet and email hand-offs. */
export const useShareLink = (child: ShareChild | null | undefined, userId: string | undefined, blob: Blob | null) => {
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const createShareLink = async (): Promise<string | null> => {
    if (!blob || !userId || !child) {
      toast.error("Generate the PDF first.");
      return null;
    }
    setSharing(true);
    const t = toast.loading("Uploading your photo book…");
    try {
      const token = await storeKeepsake(blob, userId, child.id);
      const url = `${window.location.origin}/k/${token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Link ready & copied to clipboard 🔗", { id: t });
      return url;
    } catch (e) {
      toast.error("Couldn't create share link", {
        id: t,
        description: e instanceof Error ? e.message : String(e),
      });
      return null;
    } finally {
      setSharing(false);
    }
  };

  // Phone bottom bar: make the link if needed, then hand it to the OS share sheet (email fallback).
  const shareFromBar = async () => {
    const url = shareUrl ?? (await createShareLink());
    if (url) await shareOrEmail(`${child?.name ?? "Our"} keepsake photo book`, url);
  };

  const shareViaEmail = () => {
    if (!shareUrl) {
      toast.error("Create a share link first.");
      return;
    }
    const subject = encodeURIComponent(`${child?.name ?? "Our"} keepsake photo book`);
    const body = encodeURIComponent(
      `Here's our photo book of memories — enjoy!\n\n${shareUrl}\n\nWith love 💛`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return { sharing, shareUrl, createShareLink, shareFromBar, shareViaEmail };
};
