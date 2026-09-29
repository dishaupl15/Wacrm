"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TriangleAlert, Headset } from "lucide-react";

// `useSearchParams` opts the component out of static prerendering
// unless it sits under a Suspense boundary. We split the form into
// a child component so the outer page can prerender the chrome
// (background, card frame) while the form hydrates with the query
// string on the client.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  // Forwarded from `/join/<token>` when the visitor already has an
  // account. After a successful sign-in we send them to the join
  // page to accept rather than to /dashboard.
  const inviteToken = searchParams.get("invite");
  const t = useTranslations("LoginPage");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Full-page navigation (not router.push) so the browser issues a
    // fresh top-level request that carries the just-written Supabase
    // auth cookies to the middleware gating /dashboard. A soft
    // client-side navigation can reach the protected route before the
    // server observes the new session, so the middleware bounces it
    // back to /login — which looks like the page "just refreshing"
    // instead of signing in (issue #365). Mirrors the deliberate full
    // reload the invite-accept flow already uses in join/[token].
    const destination = inviteToken
      ? `/join/${encodeURIComponent(inviteToken)}`
      : "/dashboard";
    window.location.href = destination;
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{
        // Slightly darker than pure off-white so the white card
        // visibly lifts above the canvas. Carries a faint warm-green
        // tint to echo the brand without saturating the page.
        backgroundColor: "oklch(0.945 0.008 158)",
      }}
    >
      <div className="w-full max-w-[400px]">

        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              // Refined emerald: deeper and less saturated than the
              // previous 0.62/0.16. Reads as trustworthy against white
              // rather than fresh/bright.
              backgroundColor: "oklch(0.56 0.14 162)",
              boxShadow:
                "0 1px 4px oklch(0.56 0.14 162 / 0.30), 0 0 0 1px oklch(0.56 0.14 162 / 0.18)",
            }}
          >
            <Headset className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <div className="text-center">
            {/* Heading: near-black, rich, unmistakably primary text */}
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "oklch(0.16 0.012 260)" }}
            >
              FrontDesk
            </h1>
            {/* Subtitle: clearly secondary but not washed-out */}
            <p
              className="mt-1 text-sm leading-relaxed"
              style={{ color: "oklch(0.44 0.014 260)" }}
            >
              {inviteToken
                ? t("descAccept")
                : "Welcome back. Sign in to continue to your workspace."}
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border px-8 py-8"
          style={{
            backgroundColor: "white",
            // Slightly more defined border than before so the card
            // edge reads cleanly against the tinted background.
            borderColor: "oklch(0.90 0.006 260)",
            boxShadow:
              "0 1px 3px oklch(0 0 0 / 0.07), 0 4px 16px oklch(0 0 0 / 0.05)",
          }}
        >
          <form onSubmit={handleLogin} className="flex flex-col gap-5">

            {/* Error state */}
            {error && (
              <div
                className="flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm"
                style={{
                  borderColor: "oklch(0.577 0.245 27.325 / 0.28)",
                  backgroundColor: "oklch(0.577 0.245 27.325 / 0.07)",
                  // Slightly deeper red for better contrast than 0.45
                  color: "oklch(0.40 0.18 27)",
                }}
              >
                <TriangleAlert
                  className="mt-px h-4 w-4 shrink-0"
                  strokeWidth={2}
                />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium"
                // Labels: firm dark-neutral, clearly distinct from
                // placeholder and secondary text
                style={{ color: "oklch(0.24 0.012 260)" }}
              >
                {t("emailLabel")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 rounded-lg border bg-white text-sm transition-colors placeholder:text-[oklch(0.62_0.010_260)] focus-visible:ring-2"
                style={
                  {
                    // More visible input border — easy to read as a
                    // field without being heavy
                    borderColor: "oklch(0.84 0.007 260)",
                    // Focus ring: refined green at 25% — clear
                    // affordance without glowing neon
                    "--tw-ring-color": "oklch(0.56 0.14 162 / 0.25)",
                  } as React.CSSProperties
                }
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{ color: "oklch(0.24 0.012 260)" }}
                >
                  {t("passwordLabel")}
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium transition-colors hover:underline"
                  // Deeper green link — sufficient contrast on white,
                  // clearly interactive
                  style={{ color: "oklch(0.46 0.13 162)" }}
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 rounded-lg border bg-white text-sm transition-colors placeholder:text-[oklch(0.62_0.010_260)] focus-visible:ring-2"
                style={
                  {
                    borderColor: "oklch(0.84 0.007 260)",
                    "--tw-ring-color": "oklch(0.56 0.14 162 / 0.25)",
                  } as React.CSSProperties
                }
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="mt-1 h-10 w-full rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{
                // Refined emerald button: same hue as icon, reads
                // with confidence against the white card. Hover/active
                // handled by browser via opacity; loading gets a
                // perceptibly dimmed green.
                backgroundColor: loading
                  ? "oklch(0.60 0.12 162)"
                  : "oklch(0.56 0.14 162)",
              }}
            >
              {loading ? t("signingIn") : t("signIn")}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p
          className="mt-5 text-center text-sm"
          style={{ color: "oklch(0.44 0.014 260)" }}
        >
          {t("noAccount")}{" "}
          <Link
            href={
              inviteToken
                ? `/signup?invite=${encodeURIComponent(inviteToken)}`
                : "/signup"
            }
            className="font-medium transition-colors hover:underline"
            style={{ color: "oklch(0.46 0.13 162)" }}
          >
            {t("createAccount")}
          </Link>
        </p>
      </div>
    </div>
  );
}
