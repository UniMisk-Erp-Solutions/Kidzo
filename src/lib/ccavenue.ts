/** What `ccavenue-create-order` returns: an encrypted request to POST to CCAvenue's hosted checkout. */
export type CcavenueOrder = { order_id: string; action_url: string; access_code: string; enc_request: string };

/** Sends the browser to CCAvenue's hosted payment page (a full-page form POST, as the gateway requires). */
export function redirectToCcavenue(o: CcavenueOrder) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = o.action_url;
  for (const [name, value] of [["encRequest", o.enc_request], ["access_code", o.access_code]] as const) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

/** On a non-2xx the real reason is in the response body, not error.message. */
export async function failureReason(data: { error?: string } | null, error: unknown): Promise<string | undefined> {
  let reason: string | undefined = data?.error;
  if (!reason && error && typeof error === "object" && "context" in error) {
    reason = await (error as { context: Response }).context.json().then((b) => b?.error).catch(() => undefined);
  }
  return reason;
}
