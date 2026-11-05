// Server-side pricing + address validation for printed books (INR).
// Mirrors src/lib/bookPricing.ts and razorpay-create-book-order — a test asserts the numbers match
// the client so the price shown always equals the price charged.
export const SIZE: Record<string, number> = { "8x10": 1499, "10x12": 1999, "12x14": 2799 };
export const PAPER: Record<string, number> = { matte: 0, glossy: 199, premium: 399 };
export const BINDING: Record<string, number> = { soft: 0, hard: 599, leather: 1199 };
export const SHIPPING = 99;
export const TAX_RATE = 0.18; // GST (estimate)

export interface BookOptions {
  size: string;
  paper: string;
  binding: string;
  quantity: number;
}

export function validQuantity(q: unknown): number {
  return Math.min(10, Math.max(1, Math.floor(Number(q) || 1)));
}

export function hasValidOptions(o: { size: string; paper: string; binding: string }): boolean {
  return Object.hasOwn(SIZE, o.size) && Object.hasOwn(PAPER, o.paper) && Object.hasOwn(BINDING, o.binding);
}

export function priceBook(o: BookOptions) {
  const unit = SIZE[o.size] + PAPER[o.paper] + BINDING[o.binding];
  const subtotal = unit * o.quantity;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + SHIPPING + tax) * 100) / 100;
  return { size: o.size, paper: o.paper, binding: o.binding, quantity: o.quantity, unit, subtotal, shipping: SHIPPING, tax, total };
}

const clean = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

export interface Address {
  name: string; phone: string; street: string; city: string; state: string; zip: string; country: string;
}

/** Returns the sanitised address, or an error message for the customer. */
export function parseAddress(a: Record<string, unknown> | undefined): { address?: Address; error?: string } {
  const x = a ?? {};
  const address: Address = {
    name: clean(x.name, 100), phone: clean(x.phone, 20), street: clean(x.street, 250),
    city: clean(x.city, 100), state: clean(x.state, 100), zip: clean(x.zip, 10), country: "India",
  };
  if (!address.name || !address.street || !address.city || !address.state) return { error: "Please complete your delivery address" };
  if (!/^[1-9][0-9]{5}$/.test(address.zip)) return { error: "Enter a valid 6-digit PIN code" };
  if (!/^(\+?91)?[6-9][0-9]{9}$/.test(address.phone.replace(/[\s-]/g, ""))) return { error: "Enter a valid 10-digit mobile number" };
  return { address };
}
