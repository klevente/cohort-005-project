// PROTOTYPE: throwaway. Three layouts for Notification emails, switchable via
// ?variant=A|B|C, previewing each email kind via ?kind=. Copy is placeholder.
// Never merge.
import { useSearchParams } from "react-router";
import { PrototypeSwitcher } from "~/components/prototype-switcher";

const APP = "https://cadence.example.com";

type Quote = { author: string; text: string };

type Sample = {
  key: string;
  label: string;
  recipient: string;
  subject: string;
  preheader: string;
  headline: string;
  lines: string[];
  quotes: Quote[];
  facts: [string, string][];
  cta: string;
  url: string;
  reason: string;
};

const SAMPLES: Sample[] = [
  {
    key: "refund-request-decided",
    label: "2 · Refund Request decided",
    recipient: "Levi",
    subject: "Your refund for “TypeScript Deep Dive” was approved",
    preheader: "We'll return $49.00, the full amount you paid.",
    headline: "Your Refund Request was approved",
    lines: [
      "We approved your Refund Request for “TypeScript Deep Dive”. We'll return $49.00, the full amount you paid, and email you again once it's sent.",
      "You no longer have access to the course.",
    ],
    quotes: [{ author: "Note from the Cadence team", text: "Sorry it wasn't the right fit. Hope to see you on another course!" }],
    facts: [
      ["Course", "TypeScript Deep Dive"],
      ["Amount", "$49.00"],
      ["Decided", "11 Nov 2026"],
    ],
    cta: "View the course",
    url: `${APP}/courses/typescript-deep-dive`,
    reason: "You're getting this because you asked for a refund on Cadence.",
  },
  {
    key: "refund-issued",
    label: "4 · Refund Issued",
    recipient: "Levi",
    subject: "$49.00 is on its way back to you",
    preheader: "Your refund for “TypeScript Deep Dive” has been sent.",
    headline: "Your Refund has been sent",
    lines: [
      "We've sent $49.00 back to the card you paid with, for “TypeScript Deep Dive”. Depending on your bank it can take 5–10 days to show up.",
    ],
    quotes: [],
    facts: [
      ["Course", "TypeScript Deep Dive"],
      ["Amount", "$49.00"],
      ["Sent", "12 Nov 2026"],
    ],
    cta: "Browse courses",
    url: `${APP}/courses`,
    reason: "You're getting this because you asked for a refund on Cadence.",
  },
  {
    key: "question-asked",
    label: "6 · Question asked",
    recipient: "Grace",
    subject: "Ada asked a question on “Generics in practice”",
    preheader: "“Why does the constraint need extends keyof T here…”",
    headline: "New question on your course",
    lines: [
      "Ada Lovelace asked a question on “Generics in practice” in TypeScript Deep Dive.",
    ],
    quotes: [
      {
        author: "Ada Lovelace",
        text: "Why does the constraint need `extends keyof T` here? I tried just `string` and it compiled, but the autocomplete went away.",
      },
    ],
    facts: [],
    cta: "Answer the question",
    url: `${APP}/courses/typescript-deep-dive/lessons/42#comment-981`,
    reason: "You're getting this because you teach TypeScript Deep Dive on Cadence.",
  },
  {
    key: "comment-replied",
    label: "7 · Reply to your comment",
    recipient: "Ada",
    subject: "Grace replied to your comment on “Generics in practice”",
    preheader: "“Good catch! With just string, TypeScript can't…”",
    headline: "New reply to your comment",
    lines: ["Grace Hopper replied to your comment on “Generics in practice”."],
    quotes: [
      {
        author: "You",
        text: "Why does the constraint need `extends keyof T` here? I tried just `string` and it compiled…",
      },
      {
        author: "Grace Hopper (Instructor)",
        text: "Good catch! With just `string`, TypeScript can't tell which keys exist on T, so it can't suggest them. `keyof T` narrows it to the real keys.",
      },
    ],
    facts: [],
    cta: "See the conversation",
    url: `${APP}/courses/typescript-deep-dive/lessons/42#comment-982`,
    reason: "You're getting this because you commented on a lesson on Cadence.",
  },
  {
    key: "course-archived",
    label: "11 · Course archived",
    recipient: "Ada",
    subject: "“Intro to SQL” has been archived",
    preheader: "Its Instructor has archived a course you're enrolled on.",
    headline: "A course you're enrolled on was archived",
    lines: [
      "“Intro to SQL” has been archived by its Instructor. [Placeholder: what archiving means for an enrolled Student isn't decided yet.]",
    ],
    quotes: [],
    facts: [
      ["Course", "Intro to SQL"],
      ["Instructor", "Edgar Codd"],
    ],
    cta: "Go to your dashboard",
    url: `${APP}/dashboard`,
    reason: "You're getting this because you're enrolled on Intro to SQL.",
  },
];

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

const KNOCK_BADGE = `<div style="margin-top:12px;font-size:11px;color:#9ca3af">⚡ Powered by Knock <em>(Free plan, can't be removed)</em></div>`;

// A: Plain note. Reads like a person wrote it. No logo, no button, one link.
function plainNote(s: Sample) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#fff;font:15px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111">
  <div style="max-width:560px">
    <p>Hi ${esc(s.recipient)},</p>
    ${s.lines.map((l) => `<p>${esc(l)}</p>`).join("")}
    ${s.quotes.map((q) => `<p style="color:#444">${esc(q.author)} wrote:<br>&gt; ${esc(q.text)}</p>`).join("")}
    <p><a href="${s.url}" style="color:#2563eb">${esc(s.url)}</a></p>
    <p>— Cadence</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px">
    <div style="font-size:12px;color:#6b7280">${esc(s.reason)}</div>
    ${KNOCK_BADGE}
  </div></body></html>`;
}

// B: Branded card. Wordmark bar, headline, short body, one button.
function brandedCard(s: Sample) {
  return `<!doctype html><html><body style="margin:0;padding:32px 12px;background:#f4f4f5;font:15px/1.6 Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#18181b">
  <div style="max-width:560px;margin:0 auto">
    <div style="background:#18181b;color:#fff;padding:14px 24px;border-radius:10px 10px 0 0;font-weight:700;font-size:18px;letter-spacing:-0.02em">Cadence</div>
    <div style="background:#fff;padding:28px 24px;border-radius:0 0 10px 10px;border:1px solid #e4e4e7;border-top:none">
      <h1 style="margin:0 0 12px;font-size:20px;letter-spacing:-0.01em">${esc(s.headline)}</h1>
      ${s.lines.map((l) => `<p style="margin:0 0 12px">${esc(l)}</p>`).join("")}
      <a href="${s.url}" style="display:inline-block;margin-top:8px;background:#18181b;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">${esc(s.cta)}</a>
    </div>
    <div style="text-align:center;padding:16px;font-size:12px;color:#71717a">${esc(s.reason)}<br>Cadence · video courses</div>
    <div style="text-align:center">${KNOCK_BADGE}</div>
  </div></body></html>`;
}

// C: Content-forward. The thing itself (question, reply, amounts) in the email.
function contentForward(s: Sample) {
  const initials = (n: string) =>
    n
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2);
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#fff;font:15px/1.55 Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#18181b">
  <div style="max-width:600px;margin:0 auto">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e4e4e7;padding-bottom:10px;margin-bottom:20px">
      <span style="font-weight:700;letter-spacing:-0.02em">Cadence</span>
      <span style="font-size:12px;color:#71717a">${esc(s.label.split(" · ")[1])}</span>
    </div>
    <p style="margin:0 0 16px;font-size:17px;font-weight:600">${esc(s.lines[0])}</p>
    ${s.quotes
      .map(
        (q) => `<div style="display:flex;gap:12px;margin:0 0 14px">
      <div style="flex:none;width:32px;height:32px;border-radius:50%;background:#e4e4e7;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center">${esc(initials(q.author))}</div>
      <div style="flex:1;background:#f4f4f5;border-radius:8px;padding:10px 14px">
        <div style="font-size:12px;font-weight:600;color:#52525b;margin-bottom:4px">${esc(q.author)}</div>${esc(q.text)}
      </div></div>`
      )
      .join("")}
    ${
      s.facts.length
        ? `<table style="width:100%;border-collapse:collapse;margin:0 0 16px;font-size:14px">${s.facts
            .map(
              ([k, v]) =>
                `<tr><td style="padding:6px 0;color:#71717a;border-bottom:1px solid #f4f4f5">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:600;border-bottom:1px solid #f4f4f5">${esc(v)}</td></tr>`
            )
            .join("")}</table>`
        : ""
    }
    ${s.lines
      .slice(1)
      .map((l) => `<p style="margin:0 0 12px;color:#3f3f46">${esc(l)}</p>`)
      .join("")}
    <a href="${s.url}" style="display:block;text-align:center;margin:20px 0;background:#18181b;color:#fff;text-decoration:none;padding:12px;border-radius:8px;font-weight:600">${esc(s.cta)} →</a>
    <div style="font-size:12px;color:#71717a">${esc(s.reason)} This is also in your Inbox on Cadence.</div>
    ${KNOCK_BADGE}
  </div></body></html>`;
}

const VARIANTS = [
  { key: "A", name: "Plain note", render: plainNote },
  { key: "B", name: "Branded card", render: brandedCard },
  { key: "C", name: "Content-forward", render: contentForward },
];

export default function PrototypeEmails() {
  const [searchParams, setSearchParams] = useSearchParams();
  const variant =
    VARIANTS.find((v) => v.key === searchParams.get("variant")) ?? VARIANTS[0];
  const sample =
    SAMPLES.find((s) => s.key === searchParams.get("kind")) ?? SAMPLES[0];
  const html = variant.render(sample);

  function pickKind(key: string) {
    const params = new URLSearchParams(searchParams);
    params.set("kind", key);
    setSearchParams(params, { replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/40 p-6 pb-24">
      <div className="mb-4 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s.key}
            onClick={() => pickKind(s.key)}
            className={`rounded-full border px-3 py-1 text-sm ${
              s.key === sample.key
                ? "bg-foreground text-background"
                : "bg-background"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-lg border bg-background p-4 text-sm">
        <div>
          <span className="text-muted-foreground">From:</span> Cadence
          &lt;notifications@cadence.example.com&gt;
        </div>
        <div>
          <span className="text-muted-foreground">Subject:</span>{" "}
          <strong>{sample.subject}</strong>
        </div>
        <div className="text-muted-foreground">
          Preview text: {sample.preheader}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <figure>
          <figcaption className="mb-1 text-xs text-muted-foreground">
            Desktop (640px)
          </figcaption>
          <iframe
            title="desktop"
            srcDoc={html}
            className="h-[720px] w-[640px] rounded-lg border bg-white"
          />
        </figure>
        <figure>
          <figcaption className="mb-1 text-xs text-muted-foreground">
            Phone (375px)
          </figcaption>
          <iframe
            title="phone"
            srcDoc={html}
            className="h-[720px] w-[375px] rounded-lg border bg-white"
          />
        </figure>
      </div>

      <PrototypeSwitcher
        variants={VARIANTS.map(({ key, name }) => ({ key, name }))}
      />
    </div>
  );
}
