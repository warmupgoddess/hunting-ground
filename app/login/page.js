"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN = 30;

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendMagicLink = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
      setCooldown(RESEND_COOLDOWN);
    }
    setLoading(false);
  }, [email]);

  async function handleSubmit(e) {
    e.preventDefault();
    await sendMagicLink();
  }

  async function handleResend() {
    if (cooldown > 0 || loading) return;
    await sendMagicLink();
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-end px-6 pb-12">
      {/* Background rupee symbol */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <span
          style={{
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: 900,
            fontSize: "min(80vw, 500px)",
            lineHeight: 1,
            color: "transparent",
            WebkitTextFillColor: "transparent",
            background:
              "linear-gradient(180deg, rgba(255,196,196,0.06) 0%, rgba(255,196,196,0.12) 45%, rgba(255,196,196,0.04) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          ₹
        </span>
      </div>

      {/* #lifeismy branding */}
      <div className="absolute left-6 pointer-events-none select-none" style={{ bottom: "45%" }}>
        <p
          style={{
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: 300,
            fontSize: "clamp(2rem, 10vw, 4rem)",
            letterSpacing: "0.08em",
            color: "rgba(232, 228, 222, 0.85)",
            lineHeight: 1.1,
          }}
        >
          #lifeismy
        </p>
        <p
          style={{
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: 400,
            fontSize: "clamp(1.2rem, 5vw, 2rem)",
            letterSpacing: "-0.11em",
            color: "rgba(255, 255, 255, 0.25)",
            marginTop: "0.25rem",
          }}
        >
          hunting<span style={{ letterSpacing: "0.8em" }}>{" "}</span>groundz₹
        </p>
      </div>

      {/* Auth form area */}
      <div className="relative z-10 w-full max-w-sm">
        {sent ? (
          <div>
            <p className="text-muted" style={{ fontSize: "18px", fontWeight: 200 }}>
              check your email for a login link.
            </p>
            <p className="text-muted mt-2" style={{ fontSize: "18px", fontWeight: 200 }}>
              sent to {email}
            </p>
            {error && <p className="text-red-400 mt-3">{error}</p>}
            <div className="flex justify-end mt-4">
              <button
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="text-stone hover:text-cream transition-colors disabled:text-muted"
              >
                {loading
                  ? "sending..."
                  : cooldown > 0
                    ? `resend in ${cooldown}s`
                    : "resend"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-muted mb-2" style={{ fontSize: "18px", fontWeight: 200 }}>
              login/signup
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              required
              className="w-full bg-surface text-cream placeholder:text-muted px-4 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone"
              style={{ fontSize: "18px", fontWeight: 200 }}
            />
            {error && <p className="text-red-400 mt-2">{error}</p>}
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-cream text-bg px-5 py-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ fontSize: "18px", fontWeight: 200 }}
              >
                {loading ? "..." : "enter"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
