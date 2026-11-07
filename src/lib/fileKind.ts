/** True when a stored attachment URL points at a PDF (achievement files can be a photo or a PDF). */
export const isPdfUrl = (url?: string | null) => !!url && /\.pdf(\?|#|$)/i.test(url);
