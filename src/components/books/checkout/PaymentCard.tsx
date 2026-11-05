const LINK = "underline";

/** Razorpay note + the terms checkbox. */
export const PaymentCard = ({ terms, onTerms }: { terms: boolean; onTerms: (v: boolean) => void }) => (
  <section className="rounded-2xl border bg-card p-4 md:p-5">
    <h3 className="text-[14px] font-semibold">Payment</h3>
    <p className="mt-1 text-[12px] text-muted-foreground">
      Secure payment by Razorpay — UPI, cards, net banking and wallets. We never see your card details. We currently deliver within India only.
    </p>
    <label className="mt-3 flex items-start gap-2 text-[12px]">
      <input type="checkbox" checked={terms} onChange={(e) => onTerms(e.target.checked)} className="mt-0.5" />
      <span>
        I agree to the <a href="/legal/terms" target="_blank" rel="noreferrer" className={LINK}>Terms</a>,{" "}
        <a href="/legal/refund-policy" target="_blank" rel="noreferrer" className={LINK}>Refund Policy</a> and{" "}
        <a href="/legal/shipping-policy" target="_blank" rel="noreferrer" className={LINK}>Shipping Policy</a>. I understand my book is printed to order.
      </span>
    </label>
  </section>
);
