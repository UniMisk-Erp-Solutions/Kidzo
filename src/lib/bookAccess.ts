/**
 * Who sees what in a book preview.
 * - Every plan can browse templates, create a book and preview it.
 * - Plans WITHOUT `photo_book_orders` (Free) see only the first FREE_PREVIEW_PAGES pages;
 *   later pages are replaced by a locked placeholder — their real content is never rendered.
 * - Plans WITH `photo_book_orders` (Family, Premium) see every page and can order.
 * Ordering is enforced again on the server (razorpay-create-book-order).
 */
export const FREE_PREVIEW_PAGES = 2;

export const isPageLocked = (pageIndex: number, fullAccess: boolean) =>
  !fullAccess && pageIndex >= FREE_PREVIEW_PAGES;
