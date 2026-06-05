import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { SEO } from "@/components/SEO";
import { Mail, MessageCircle, LifeBuoy, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ogImage from "@/assets/og-kidzopedia.jpg";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("General");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      toast.error("Please add your email and a short message.");
      return;
    }
    setSending(true);
    // Open the user's mail client as a graceful no-backend fallback
    const subject = encodeURIComponent(`[Kidzopedia · ${topic}] from ${name || email}`);
    const body = encodeURIComponent(`${message}\n\n— ${name || "A friend"} (${email})`);
    window.location.href = `mailto:hello@kidzopedia.com?subject=${subject}&body=${body}`;
    setTimeout(() => {
      setSending(false);
      toast.success("Opening your email app to finish sending — we'll reply soon!");
    }, 600);
  };

  return (
    <LandingLayout>
      <SEO
        title="Contact Kidzopedia — We'd Love to Hear From You"
        description="Questions, feedback, partnerships, press — we read every message and reply within 1–2 business days."
        ogImage={ogImage}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Contact Kidzopedia",
            description: "Reach the Kidzopedia team for support, feedback, partnerships and press.",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: "hello@kidzopedia.com",
              availableLanguage: ["English"],
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: "How quickly do you reply?", acceptedAnswer: { "@type": "Answer", text: "Within 1–2 business days, often the same day." } },
              { "@type": "Question", name: "Where do I report a bug?", acceptedAnswer: { "@type": "Answer", text: "Use the form on this page with topic 'Bug report' or email hello@kidzopedia.com with steps to reproduce." } },
              { "@type": "Question", name: "How do I request a feature?", acceptedAnswer: { "@type": "Answer", text: "Use the form with topic 'Feature request' — we read every suggestion and reply." } },
              { "@type": "Question", name: "Can I delete my account?", acceptedAnswer: { "@type": "Answer", text: "Yes — from Settings inside the app. Your data is removed and you'll receive an email confirmation." } },
              { "@type": "Question", name: "Do you do press interviews?", acceptedAnswer: { "@type": "Answer", text: "Yes — choose 'Press & partnerships' from the topic list and we'll get back to you quickly." } },
              { "@type": "Question", name: "Is there phone support?", acceptedAnswer: { "@type": "Answer", text: "Not yet. Email gives us the room to write you a thoughtful reply with screenshots when needed." } },
            ],
          },
        ]}
      />
      <section className="bg-gradient-warm">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-primary-deep">Contact</span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
            We'd love to hear from you.
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
            Questions, feedback, partnerships, press — we read every message and reply within 1–2 business days.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Channels */}
          <aside className="space-y-4 md:col-span-2">
            {[
              { icon: Mail, t: "Email us", d: "hello@kidzopedia.com", href: "mailto:hello@kidzopedia.com" },
              { icon: LifeBuoy, t: "Help & support", d: "Account, billing, sharing — we're here.", href: "mailto:support@kidzopedia.com" },
              { icon: MessageCircle, t: "Press & partnerships", d: "Tell us about your community.", href: "mailto:hello@kidzopedia.com" },
            ].map((c) => (
              <a
                key={c.t}
                href={c.href}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/30 text-primary-deep">
                  <c.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold">{c.t}</div>
                  <div className="text-[14px] text-muted-foreground">{c.d}</div>
                </div>
              </a>
            ))}
          </aside>

          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft md:col-span-3 md:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="topic">Topic</Label>
              <select
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-[14px]"
              >
                <option>General</option>
                <option>Account & billing</option>
                <option>Bug report</option>
                <option>Feature request</option>
                <option>Press & partnerships</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us a little about what's on your mind..."
                rows={6}
                className="rounded-xl"
              />
            </div>

            <Button type="submit" variant="warm" size="lg" className="w-full" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Opening your email…" : "Send message"}
            </Button>
            <p className="text-center text-[12px] text-muted-foreground">
              By sending, you agree to our friendly use of your email to reply.
            </p>
          </form>
        </div>
      </section>
    </LandingLayout>
  );
};

export default Contact;
