import { jsPDF } from "jspdf";

export type InvoiceInput = {
  id: string;
  created_at?: string;
  paid_at?: string | null;
  status?: string | null;
  plan_name?: string | null;
  billing_cycle?: string | null;
  amount: number;
  discount_amount?: number | null;
  currency?: string | null;
  provider_payment_id?: string | null;
  provider_order_id?: string | null;
  bill_to_name?: string | null;
  bill_to_email?: string | null;
};

export const invoiceNumber = (id: string) => `KZ-${id.slice(0, 8).toUpperCase()}`;

// Use the currency CODE (e.g. "INR") not the ₹ glyph — jsPDF's built-in fonts
// don't include the rupee symbol, which is the classic cause of "broken" PDFs.
const money = (cur: string, n: number) => `${cur} ${Number(n || 0).toFixed(2)}`;

export function downloadInvoicePdf(inv: InvoiceInput) {
  const cur = (inv.currency || "INR").toUpperCase();
  const num = invoiceNumber(inv.id);
  const dateStr = new Date(inv.paid_at || inv.created_at || Date.now()).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });
  const total = Number(inv.amount || 0);
  const discount = Number(inv.discount_amount || 0);
  const subtotal = total + discount;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const m = 16;

  // ── header band ──
  doc.setFillColor(226, 149, 120); // #E29578
  doc.rect(0, 0, W, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Kidzopedia", m, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("The Little Encyclopedia of Your Child's Life", m, 23);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("INVOICE", W - m, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("kidzopedia.com", W - m, 23, { align: "right" });

  // ── meta + bill-to ──
  let y = 46;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  const label = (t: string, x: number, yy: number) => { doc.setFont("helvetica", "bold"); doc.text(t, x, yy); };
  const val = (t: string, x: number, yy: number) => { doc.setFont("helvetica", "normal"); doc.text(t, x, yy); };
  label("Invoice #", m, y); val(num, m + 28, y);
  label("Date", m, y + 6); val(dateStr, m + 28, y + 6);
  label("Status", m, y + 12); val((inv.status || "").toUpperCase() || "—", m + 28, y + 12);

  label("Billed to", W - m - 64, y);
  val(inv.bill_to_name || "Customer", W - m - 64, y + 6);
  if (inv.bill_to_email) val(inv.bill_to_email, W - m - 64, y + 12);

  // ── line items table ──
  y = 80;
  doc.setFillColor(245, 243, 239);
  doc.rect(m, y, W - 2 * m, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Description", m + 3, y + 6);
  doc.text("Amount", W - m - 3, y + 6, { align: "right" });

  y += 16;
  doc.setFont("helvetica", "normal");
  const desc = `${inv.plan_name || "Plan"} — ${inv.billing_cycle || "monthly"}${discount > 0 ? " (one-time)" : ""}`;
  doc.text(desc, m + 3, y);
  doc.text(money(cur, subtotal), W - m - 3, y, { align: "right" });
  doc.setDrawColor(225, 225, 225);
  doc.line(m, y + 5, W - m, y + 5);

  // ── totals ──
  y += 14;
  const lx = W - m - 64;
  const rx = W - m - 3;
  if (discount > 0) {
    doc.text("Subtotal", lx, y); doc.text(money(cur, subtotal), rx, y, { align: "right" }); y += 6;
    doc.text("Discount", lx, y); doc.text("-" + money(cur, discount), rx, y, { align: "right" }); y += 6;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total paid", lx, y + 2);
  doc.text(money(cur, total), rx, y + 2, { align: "right" });

  // ── payment details ──
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  if (inv.provider_payment_id) { doc.text(`Payment ID: ${inv.provider_payment_id}`, m, y); y += 5; }
  if (inv.provider_order_id) { doc.text(`Reference: ${inv.provider_order_id}`, m, y); y += 5; }
  doc.text("Payment method: Razorpay", m, y);

  // ── footer ──
  doc.setDrawColor(225, 225, 225);
  doc.line(m, 270, W - m, 270);
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text("Thank you for being part of Kidzopedia.", m, 277);
  doc.text("This is a system-generated invoice.", m, 282);

  doc.save(`Kidzopedia-Invoice-${num}.pdf`);
}
