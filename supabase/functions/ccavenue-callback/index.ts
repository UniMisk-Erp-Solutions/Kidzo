// CCAvenue sends the customer's browser back here (redirect_url AND cancel_url) with an encrypted
// `encResp`. Deployed with verify_jwt = false (a gateway POST carries no user JWT).
//
//  - `encResp` must decrypt with our working key (AES-256-GCM is also authenticated); otherwise it's discarded.
//  - The order is looked up in our own ledger and the paid amount/currency must match what the server
//    priced, otherwise it is flagged for review and NOT activated (checked inside ccavenue_apply_result).
//  - The state change is one atomic, idempotent SQL function, so a refresh/replay can't double-activate.
//  - Finally the browser is 303-redirected to the result page with only the opaque order id.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  CcavConfigError, decrypt, loadConfig, normalizeGatewayStatus, ORDER_ID_RE, parseResponse, resultPageUrl,
} from "../_shared/ccavenue.ts";
import { redirect303 } from "../_shared/http.ts";

const MAX_BODY = 64 * 1024;

Deno.serve(async (req) => {
  const get = (k: string) => Deno.env.get(k);
  const site = (get("SITE_URL") ?? "").replace(/\/+$/, "");
  const fallback = redirect303(site ? `${site}/payment/result?error=invalid` : "/");

  try {
    const cfg = loadConfig(get);
    const invalid = redirect303(resultPageUrl(cfg));
    if (req.method !== "POST") return invalid;

    const raw = await req.text();
    if (raw.length > MAX_BODY) return invalid;
    const encResp = new URLSearchParams(raw).get("encResp");
    if (!encResp) return invalid;

    let f: Record<string, string>;
    try {
      f = parseResponse(decrypt(encResp, cfg.workingKey, cfg.mode));
    } catch {
      console.error("ccavenue-callback: undecryptable payload discarded");
      return invalid;
    }
    const orderId = f.order_id ?? "";
    if (!ORDER_ID_RE.test(orderId)) return invalid;

    const admin = createClient(get("SUPABASE_URL")!, get("SUPABASE_SERVICE_ROLE_KEY")!);
    const result = normalizeGatewayStatus(f.order_status);
    const { data, error } = await admin.rpc("ccavenue_apply_result", {
      p_order_id: orderId,
      p_result: result === "unknown" ? "pending" : result,
      p_tracking_id: f.tracking_id ?? null,
      p_amount: f.amount ? Number(f.amount) : null,
      p_currency: f.currency ?? null,
      p_payment_mode: f.payment_mode ?? null,
      p_bank_ref: f.bank_ref_no ?? null,
      p_message: f.failure_message ?? f.status_message ?? null,
      p_gateway_status: f.order_status ?? null,
    });
    if (error) throw error;
    if (data === "not_found") return invalid;

    console.log(`ccavenue-callback: ${orderId} ${f.order_status} -> ${data}`);
    return redirect303(resultPageUrl(cfg, orderId));
  } catch (err) {
    if (!(err instanceof CcavConfigError)) console.error("ccavenue-callback error", err);
    return fallback;
  }
});
