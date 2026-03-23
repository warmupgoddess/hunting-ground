"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ItemActions({ item, huntId }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title || "");
  const [price, setPrice] = useState(
    item.price != null ? String(item.price) : ""
  );
  const [source, setSource] = useState(item.source || "");
  const [url, setUrl] = useState(item.url || "");
  const [notes, setNotes] = useState(item.notes || "");
  const [favorite, setFavorite] = useState(item.is_favorite || false);

  // Title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);

  // Price editing
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState(price);

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(notes);

  useEffect(() => {
    function onNotesUpdated(e) {
      setNotes(e.detail.notes);
      setNotesDraft(e.detail.notes);
    }
    window.addEventListener("notes-updated", onNotesUpdated);
    return () => window.removeEventListener("notes-updated", onNotesUpdated);
  }, []);

  async function saveField(field, value) {
    const supabase = createClient();
    const parsed =
      field === "price"
        ? value
          ? parseFloat(value)
          : null
        : value || null;

    await supabase
      .from("items")
      .update({ [field]: parsed })
      .eq("id", item.id);

    await supabase
      .from("hunts")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", huntId);

    router.refresh();
  }

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    const supabase = createClient();
    await supabase
      .from("items")
      .update({ is_favorite: next })
      .eq("id", item.id);
    router.refresh();
  }

  return (
    <div>
      {/* Title */}
      {editingTitle ? (
        <input
          type="text"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={() => {
            setEditingTitle(false);
            if (titleDraft !== title) {
              setTitle(titleDraft);
              saveField("title", titleDraft);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.target.blur();
            if (e.key === "Escape") { setTitleDraft(title); setEditingTitle(false); }
          }}
          autoFocus
          placeholder="title"
          className="bg-surface text-cream px-2 py-1 rounded focus:outline-none w-full"
          style={{ fontSize: '24px', fontWeight: 500, boxShadow: '0 0 0 0.5px rgba(255,255,255,0.08)' }}
        />
      ) : (
        <h1
          onClick={() => { setTitleDraft(title); setEditingTitle(true); }}
          className="cursor-pointer hover:opacity-70 transition-opacity"
          style={{ fontSize: '24px', fontWeight: 500 }}
        >
          {title || "untitled"}
        </h1>
      )}

      {/* Price · Source (link) · Star */}
      <div className="flex items-center mt-2 min-w-0">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {editingPrice ? (
            <input
              type="number"
              step="0.01"
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              onBlur={() => {
                setEditingPrice(false);
                if (priceDraft !== price) {
                  setPrice(priceDraft);
                  saveField("price", priceDraft);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.target.blur();
                if (e.key === "Escape") { setPriceDraft(price); setEditingPrice(false); }
              }}
              autoFocus
              placeholder="price"
              className="bg-surface text-cream px-2 py-1 rounded focus:outline-none w-20"
              style={{ boxShadow: '0 0 0 0.5px rgba(255,255,255,0.08)' }}
            />
          ) : (
            <span
              onClick={() => { setPriceDraft(price); setEditingPrice(true); }}
              className="text-stone cursor-pointer hover:opacity-70 transition-opacity"
            >
              {price ? `$${Number(price) % 1 ? Number(price).toFixed(2) : Number(price)}` : "add price"}
            </span>
          )}

          {source && (
            <>
              <span className="text-muted mx-1">&middot;</span>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-cream transition-colors truncate underline underline-offset-2"
                >
                  {source}
                </a>
              ) : (
                <span className="text-muted truncate">{source}</span>
              )}
            </>
          )}

          {!source && url && (
            <>
              <span className="text-muted mx-1">&middot;</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-cream transition-colors truncate underline underline-offset-2"
              >
                listing
              </a>
            </>
          )}
        </div>

        <button
          onClick={toggleFavorite}
          className="ml-3 transition-opacity hover:opacity-80 flex-shrink-0"
          title={favorite ? "unfavorite" : "favorite"}
        >
          {favorite ? "\u2605" : "\u2606"}
        </button>
      </div>

      {/* Notes — only shown if they exist, click to edit */}
      {(notes || editingNotes) && (
        <div className="mt-6">
          {editingNotes ? (
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={() => {
                setEditingNotes(false);
                if (notesDraft !== notes) {
                  setNotes(notesDraft);
                  saveField("notes", notesDraft);
                  window.dispatchEvent(
                    new CustomEvent("notes-updated", { detail: { notes: notesDraft } })
                  );
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setNotesDraft(notes); setEditingNotes(false); }
              }}
              autoFocus
              rows={3}
              className="w-full bg-surface text-stone px-2 py-1 rounded focus:outline-none resize-none"
              style={{ whiteSpace: "pre-line", boxShadow: '0 0 0 0.5px rgba(255,255,255,0.08)' }}
            />
          ) : (
            <div
              onClick={() => { setNotesDraft(notes); setEditingNotes(true); }}
              className="text-stone cursor-pointer hover:opacity-70 transition-opacity"
              style={{ whiteSpace: "pre-line" }}
            >
              {notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
