"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("magic"); // "magic" | "password"
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/splash");
      }
      setLoading(false);
      return;
    }

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
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="brand-title text-4xl mb-2">hunting groundz₹</h1>
        <p className="text-stone text-sm mb-10">sign in to continue</p>

        {sent ? (
          <div>
            <p className="text-cream text-sm">
              check your email for a magic link.
            </p>
            <p className="text-muted text-xs mt-2">sent to {email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your email"
              required
              className="bg-surface text-cream placeholder:text-muted px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone"
            />
            {mode === "password" && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                required
                className="bg-surface text-cream placeholder:text-muted px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone"
              />
            )}
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-cream text-bg px-4 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? "signing in..."
                : mode === "password"
                  ? "sign in"
                  : "send magic link"}
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "magic" ? "password" : "magic")}
              className="text-muted text-xs hover:text-stone transition-colors"
            >
              {mode === "magic"
                ? "use password instead"
                : "use magic link instead"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
