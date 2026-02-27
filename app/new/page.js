"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewHunt() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [vibe, setVibe] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("hunts")
      .insert({ name, vibe, user_id: user.id, status: "active" })
      .select()
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    router.push(`/hunt/${data.id}`);
  }

  return (
    <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-muted text-sm mb-10 hover:text-stone transition-colors"
      >
        &larr; back
      </button>

      <h1 className="font-serif text-2xl mb-8">new hunt</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="text-xs text-muted font-mono block mb-2">
            name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="what are you looking for?"
            required
            className="w-full bg-surface text-cream placeholder:text-muted px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone"
          />
        </div>

        <div>
          <label className="text-xs text-muted font-mono block mb-2">
            vibe
          </label>
          <textarea
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder="describe the feeling, the aesthetic..."
            rows={3}
            className="w-full bg-surface text-cream placeholder:text-muted px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name}
          className="bg-cream text-bg px-4 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
        >
          {loading ? "creating..." : "start hunting"}
        </button>
      </form>
    </div>
  );
}
