import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  Send,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SectionTitle,
  SettingsCard,
  SettingsPageHeader,
  SettingsSection,
} from "./components/settings-ui";

/* =========================================================
 * EDIT THESE — your real support details
 * ========================================================= */

const SUPPORT_EMAIL = "support@yourcompany.com";
const SUPPORT_PHONE = "+880 1XXX-XXXXXX";
const SUPPORT_WHATSAPP = "8801XXXXXXXXX"; // country code + number, no "+"
const SUPPORT_HOURS = "Sat – Thu, 10:00 AM – 6:00 PM";

const CATEGORIES = [
  "Bug / something isn't working",
  "Accounts & finance",
  "Candidates & visa processing",
  "Login & permissions",
  "Feature request",
  "Other",
] as const;

const PRIORITIES = ["Low", "Normal", "Urgent"] as const;

type Priority = (typeof PRIORITIES)[number];

const FAQS = [
  {
    q: "A balance or total looks wrong. What should I do?",
    a: "Refresh the page first. If it is still wrong, send a ticket with the account name and the transaction you expected, so we can trace it.",
  },
  {
    q: "I can't see a page or button my teammate can.",
    a: "Access depends on your role. Ask your administrator to check your permissions, or send a ticket under Login & permissions.",
  },
  {
    q: "A table is not loading any data.",
    a: "Check your internet connection and reload. If it keeps happening, tell us which page it is and the time it happened.",
  },
  {
    q: "How do I add a new bank, cash, or mobile banking account?",
    a: "Open Accounts and press Add Account at the top right, then fill in the name, type, and opening balance.",
  },
  {
    q: "How quickly will I get a reply?",
    a: "Normal tickets are answered within one working day. Mark a ticket Urgent only if work is blocked.",
  },
];

/* =========================================================
 * SMALL PIECES
 * ========================================================= */

function ContactTile({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/50"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </a>
  );
}

const textareaClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50";

/* =========================================================
 * PAGE
 * ========================================================= */

function SupportPage() {
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [priority, setPriority] = useState<Priority>("Normal");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const canSubmit =
    subject.trim().length > 0 && message.trim().length > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!canSubmit) return;

    // No backend yet: opens the user's email app with everything filled in.
    // Later, replace this block with your own API call (e.g. createTicket()).
    const body = [
      `Category: ${category}`,
      `Priority: ${priority}`,
      "",
      message.trim(),
    ].join("\n");

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      `[${priority}] ${subject.trim()}`,
    )}&body=${encodeURIComponent(body)}`;

    setSent(true);
  }

  function resetForm() {
    setSubject("");
    setMessage("");
    setPriority("Normal");
    setCategory(CATEGORIES[0]);
    setSent(false);
  }

  return (
    <div className="space-y-4">
      <SettingsPageHeader
        icon={LifeBuoy}
        title="Support"
        description="Tell us what went wrong and we will help you fix it."
        action={
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <Clock className="size-4" />
            {SUPPORT_HOURS}
          </div>
        }
      />

      <SettingsCard>
        {/* Ticket form + contacts */}
        <section className="grid lg:grid-cols-[minmax(0,1fr)_320px] lg:divide-x">
          {/* ---------- LEFT: TICKET FORM ---------- */}
          <div className="p-5">
            <SectionTitle
              icon={Send}
              title="Send a support request"
              description="The more detail you give, the faster we can solve it."
            />

            {sent ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <CheckCircle2 className="size-5" />
                </div>

                <h3 className="mt-3 text-sm font-semibold">
                  Your email app should be open
                </h3>

                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Press send there to deliver your request to {SUPPORT_EMAIL}.
                  Nothing is sent until you do.
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={resetForm}
                >
                  Write another request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Topic</Label>

                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {CATEGORIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>

                    <div
                      role="radiogroup"
                      aria-label="Priority"
                      className="grid grid-cols-3 gap-1 rounded-md border bg-muted/40 p-1"
                    >
                      {PRIORITIES.map((item) => (
                        <button
                          key={item}
                          type="button"
                          role="radio"
                          aria-checked={priority === item}
                          onClick={() => setPriority(item)}
                          className={
                            priority === item
                              ? "rounded bg-background px-2 py-1 text-sm font-medium shadow-sm"
                              : "rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                          }
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-subject">Subject</Label>

                  <Input
                    id="support-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Cash balance does not match"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-message">What happened?</Label>

                  <textarea
                    id="support-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Which page were you on, what did you do, and what did you expect to see?"
                    className={`${textareaClass} min-h-32 resize-none`}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Opens your email app with the request filled in.
                  </p>

                  <Button type="submit" size="sm" disabled={!canSubmit}>
                    <Send className="mr-2 size-4" />
                    Send request
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* ---------- RIGHT: CONTACT ---------- */}
          <div className="bg-muted/20 p-5">
            <SectionTitle
              title="Need an answer right now?"
              description="Reach us directly."
            />

            <div className="space-y-2">
              <ContactTile
                icon={MessageCircle}
                label="WhatsApp"
                value={SUPPORT_PHONE}
                href={`https://wa.me/${SUPPORT_WHATSAPP}`}
              />

              <ContactTile
                icon={Phone}
                label="Phone"
                value={SUPPORT_PHONE}
                href={`tel:${SUPPORT_PHONE.replace(/\s|-/g, "")}`}
              />

              <ContactTile
                icon={Mail}
                label="Email"
                value={SUPPORT_EMAIL}
                href={`mailto:${SUPPORT_EMAIL}`}
              />
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <SettingsSection>
          <SectionTitle
            title="Common questions"
            description="Quick answers to the things we are asked most."
          />

          <div className="divide-y rounded-lg border bg-card">
            {FAQS.map((item) => (
              <details key={item.q} className="group px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}

                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>

                <p className="mt-2 text-sm text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </SettingsSection>
      </SettingsCard>
    </div>
  );
}

export { SupportPage };
