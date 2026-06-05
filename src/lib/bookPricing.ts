// Pricing helpers for printed books (USD).
// All prices stored as numbers; rendered with formatCurrency().

export type BookSize = "8x10" | "10x12" | "12x14";
export type PaperQuality = "matte" | "glossy" | "premium";
export type BindingType = "soft" | "hard" | "leather";

export const BOOK_SIZES: Record<BookSize, { label: string; price: number; subtitle: string }> = {
  "8x10": { label: '8" × 10" (Standard)', price: 34.99, subtitle: "Most popular, perfect for shelves" },
  "10x12": { label: '10" × 12" (Premium)', price: 49.99, subtitle: "Larger format, more impressive" },
  "12x14": { label: '12" × 14" (Deluxe)', price: 69.99, subtitle: "Heirloom quality, museum-grade" },
};

export const PAPER_QUALITIES: Record<PaperQuality, { label: string; price: number; subtitle: string }> = {
  matte: { label: "Matte finish", price: 0, subtitle: "Professional look, soft finish" },
  glossy: { label: "Glossy finish", price: 5, subtitle: "Vibrant colors, lab quality" },
  premium: { label: "Premium finish", price: 10, subtitle: "Archival, museum-grade" },
};

export const BINDING_TYPES: Record<BindingType, { label: string; price: number; subtitle: string }> = {
  soft: { label: "Soft cover", price: 0, subtitle: "Flexible, lightweight" },
  hard: { label: "Hard cover", price: 15, subtitle: "Rigid, professional, durable" },
  leather: { label: "Leather-bound", price: 30, subtitle: "Luxury, heirloom quality" },
};

export const SHIPPING_FLAT = 7.99;
export const TAX_RATE = 0.06;

export function calculatePrice(opts: {
  size: BookSize;
  paper: PaperQuality;
  binding: BindingType;
  quantity: number;
}) {
  const base = BOOK_SIZES[opts.size].price;
  const paper = PAPER_QUALITIES[opts.paper].price;
  const binding = BINDING_TYPES[opts.binding].price;
  const unit = base + paper + binding;
  const subtotal = unit * opts.quantity;
  const shipping = SHIPPING_FLAT;
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);
  return { base, paper, binding, unit, subtotal: +subtotal.toFixed(2), shipping, tax, total };
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function formatOrderNumber(id: string) {
  // Short, human-friendly version: ORD-XXXXXXXX (first 8 chars uppercase)
  return `ORD-${id.slice(0, 8).toUpperCase()}`;
}
