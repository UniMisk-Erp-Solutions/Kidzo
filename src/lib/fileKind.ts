/** True when a stored attachment URL points at a PDF (achievement files can be a photo or a PDF). */
export const isPdfUrl = (url?: string | null) => !!url && /\.pdf(\?|#|$)/i.test(url);

/** Keeps only real image URLs (drops empty values and PDFs), e.g. for embedding in a book. */
export const imageUrls = (urls: (string | null | undefined)[]) => urls.filter((u): u is string => !!u && !isPdfUrl(u));
