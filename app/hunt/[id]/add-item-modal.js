"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { scrapeUrl } from "./actions";

export default function AddItemModal({ huntId }) {
  const router = useRouter();
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeHint, setScrapeHint] = useState(null);

  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [source, setSource] = useState("");

  function reset() {
    setMode(null);
    setUrl("");
    setFile(null);
    setTitle("");
    setPrice("");
    setSource("");
    setScrapeHint(null);
  }

  async function handleUrlBlur() {
    if (!url || scraping) return;
    try {
      new URL(url);
    } catch {
      return;
    }

    setScraping(true);
    setScrapeHint(null);
    const data = await scrapeUrl(url);
    setScraping(false);

    if (!data) return;
    if (!title && data.title) setTitle(data.title);
    if (!price && data.price != null) setPrice(String(data.price));
    if (!source && data.source) setSource(data.source);

    if (!data.title && !data.price) {
      setScrapeHint("couldn\u2019t read this site \u2014 fill in manually");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let imageUrl = null;

    if (mode === "photo" && file) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(path, file);

      if (uploadError) {
        console.error(uploadError);
        setLoading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("item-images").getPublicUrl(path);

      imageUrl = publicUrl;
    }

    const { error } = await supabase.from("items").insert({
      hunt_id: huntId,
      user_id: user.id,
      title: title || null,
      url: mode === "link" ? url : null,
      image_url: imageUrl,
      price: price ? parseFloat(price) : null,
      source: source || null,
      status: "considering",
    });

    if (!error) {
      await supabase
        .from("hunts")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", huntId);

      reset();
      router.refresh();
    }

    setLoading(false);
  }

  if (!mode) {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex gap-3 justify-center">
        <button
          onClick={() => setMode("link")}
          className="bg-surface hover:bg-surface-hover text-cream px-5 py-3 rounded-lg text-sm transition-colors"
        >
          paste link
        </button>
        <button
          onClick={() => setMode("photo")}
          className="bg-surface hover:bg-surface-hover text-cream px-5 py-3 rounded-lg text-sm transition-colors"
        >
          add photo
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-bg/90 z-50 flex items-end justify-center">
      <div className="w-full max-w-2xl bg-surface rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">
            {mode === "link" ? "paste a link" : "add a photo"}
          </h3>
          <button
            onClick={reset}
            className="text-muted hover:text-cream text-sm transition-colors"
          >
            cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "link" ? (
            <div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://..."
                required
                className="w-full bg-bg text-cream placeholder:text-muted px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone"
              />
              {scraping && (
                <p className="text-xs text-muted mt-1">fetching...</p>
              )}
              {scrapeHint && (
                <p className="text-xs text-stone mt-1">{scrapeHint}</p>
              )}
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="w-full bg-bg text-muted px-4 py-3 rounded-lg text-sm hover:text-stone transition-colors">
                {file ? file.name : "choose a photo..."}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                required
              />
            </label>
          )}

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title"
            className="w-full bg-bg text-cream placeholder:text-muted px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone"
          />

          <div className="flex gap-3">
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="price"
              className="w-1/2 bg-bg text-cream placeholder:text-muted px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone"
            />
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="source"
              className="w-1/2 bg-bg text-cream placeholder:text-muted px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stone"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-cream text-bg px-4 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {loading ? "adding..." : "add item"}
          </button>
        </form>
      </div>
    </div>
  );
}
