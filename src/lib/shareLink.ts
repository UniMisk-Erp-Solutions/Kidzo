/** Hands a link to the phone's share sheet, or opens an email draft where there is none. */
export async function shareOrEmail(title: string, url: string): Promise<void> {
  if (navigator.share) {
    await navigator.share({ title, url }).catch(() => {});
    return;
  }
  const body = `Here's our photo book of memories — enjoy!\n\n${url}\n\nWith love 💛`;
  window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
