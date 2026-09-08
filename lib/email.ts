/**
 * Transactional email through Resend's REST API.
 *
 * Sending is always best-effort: a failed email must never fail the request or
 * roll back a state change that already committed. Errors are logged, not thrown.
 */

const RESEND_API = "https://api.resend.com/emails";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export interface EmailInput {
  to: string;
  subject: string;
  /** Plain-text body; wrapped in the shared layout below. */
  heading: string;
  lines: string[];
  actionLabel?: string;
  actionUrl?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function appUrl(path: string): string {
  const base = process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function renderEmail(input: EmailInput): string {
  const paragraphs = input.lines
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#4b5165">${escapeHtml(line)}</p>`,
    )
    .join("");

  const action =
    input.actionLabel && input.actionUrl
      ? `<a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;margin-top:8px;padding:11px 22px;border-radius:999px;background:#ea580c;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">${escapeHtml(input.actionLabel)}</a>`
      : "";

  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f7f7f8;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #eceef2;border-radius:16px;padding:28px">
    <p style="margin:0 0 18px;font-size:15px;font-weight:700;color:#14161f">Influnz</p>
    <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#14161f">${escapeHtml(input.heading)}</h1>
    ${paragraphs}
    ${action}
  </div>
</body></html>`;
}

export async function sendEmail(input: EmailInput): Promise<void> {
  if (!isEmailConfigured()) {
    // Nothing configured yet (local dev): log so the flow is still traceable.
    console.info(`[email skipped] to=${input.to} subject="${input.subject}"`);
    return;
  }

  try {
    const response = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: renderEmail(input),
      }),
    });

    if (!response.ok) {
      console.error(`Email send failed (${response.status}): ${await response.text()}`);
    }
  } catch (error) {
    console.error("Email send threw", error);
  }
}
