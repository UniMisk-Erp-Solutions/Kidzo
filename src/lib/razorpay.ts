declare global {
  interface Window {
    Razorpay?: any;
  }
}

const RAZORPAY_SDK = "https://checkout.razorpay.com/v1/checkout.js";

/** Loads Razorpay Checkout once; resolves false if the script can't be fetched. */
export const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = RAZORPAY_SDK;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
