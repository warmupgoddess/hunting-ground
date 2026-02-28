"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUSES = [
  { value: "considering", label: "considering" },
  { value: "offer_sent", label: "offer sent" },
  { value: "purchased", label: "purchased" },
  { value: "sold_out", label: "sold out" },
];

function EditableField({
  value,
  onSave,
  displayValue,
  inputType = "text",
  className = "",
  inputClassName = "",
  placeholder = "",
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }

  async function commit() {
    setEditing(false);
    if (draft !== value) {
      await onSave(draft);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.target.blur();
    } else if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        type={inputType}
        step={inputType === "number" ? "0.01" : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        autoFocus
        placeholder={placeholder}
        className={`bg-surface text-cream px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-stone ${inputClassName}`}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      className={`cursor-pointer hover:opacity-70 transition-opacity ${className}`}
      title="click to edit"
    >
      {displayValue}
    </span>
  );
}

function EditableNotes({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [display, setDisplay] = useState(value);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef(null);

  useEffect(() => {
    setDisplay(value);
  }, [value]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [editing, draft]);

  function startEdit() {
    setDraft(display);
    setEditing(true);
  }

  async function commit() {
    setDisplay(draft);
    setEditing(false);
    if (draft !== value) {
      await onSave(draft);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setDraft(display);
      setEditing(false);
    }
  }

  if (editing || !display) {
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        autoFocus={editing}
        onFocus={() => setEditing(true)}
        placeholder="add notes..."
        rows={3}
        className="w-full bg-surface text-cream placeholder:text-muted px-2 py-1 rounded font-serif text-sm focus:outline-none focus:ring-1 focus:ring-stone resize-none"
      />
    );
  }

  return (
    <div
      onClick={startEdit}
      className="cursor-pointer hover:opacity-70 transition-opacity"
      title="click to edit"
    >
      <div
        className="font-serif text-stone text-sm"
        style={{ whiteSpace: "pre-line" }}
      >
        {display}
      </div>
    </div>
  );
}

export default function ItemActions({ item, huntId }) {
  const router = useRouter();
  const [status, setStatus] = useState(item.status);
  const [title, setTitle] = useState(item.title || "");
  const [price, setPrice] = useState(
    item.price != null ? String(item.price) : ""
  );
  const [source, setSource] = useState(item.source || "");
  const [url, setUrl] = useState(item.url || "");
  const [notes, setNotes] = useState(item.notes || "");
  const [favorite, setFavorite] = useState(item.is_favorite || false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function updateStatus(newStatus) {
    setStatus(newStatus);
    await saveField("status", newStatus);
  }


  function share() {
    const parts = [title];
    if (price) parts.push(`$${Number(price) % 1 ? Number(price).toFixed(2) : Number(price)}`);
    if (source) parts.push(`from ${source}`);
    if (url) parts.push(url);

    navigator.clipboard.writeText(parts.filter(Boolean).join(" — "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      {/* Title */}
      <EditableField
        value={title}
        onSave={(v) => {
          setTitle(v);
          return saveField("title", v);
        }}
        displayValue={
          <h1 className="font-serif text-xl">{title || "untitled"}</h1>
        }
        placeholder="title"
        inputClassName="w-full font-serif text-xl"
      />

      {/* Price · Source */}
      <div className="flex items-center gap-1 mt-2 min-w-0">
        <EditableField
          value={price}
          onSave={(v) => {
            setPrice(v);
            return saveField("price", v);
          }}
          displayValue={
            <span className="font-mono text-sm text-stone">
              {price ? `$${Number(price) % 1 ? Number(price).toFixed(2) : Number(price)}` : "add price"}
            </span>
          }
          inputType="number"
          placeholder="price"
          inputClassName="w-24"
        />
        <span className="text-sm text-muted mx-1">&middot;</span>
        <EditableField
          value={source}
          onSave={(v) => {
            setSource(v);
            return saveField("source", v);
          }}
          displayValue={
            <span className="text-sm text-muted truncate">
              {source || "add source"}
            </span>
          }
          placeholder="source"
          inputClassName="w-full min-w-[8rem]"
        />
      </div>

      {/* Open listing link */}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 py-1 text-sm text-stone hover:text-cream transition-colors underline underline-offset-2"
        >
          open listing &rarr;
        </a>
      )}

      {/* Star toggle + Status pills */}
      <div className="flex items-start gap-3 mt-6">
        <button
          onClick={toggleFavorite}
          className="text-lg transition-opacity hover:opacity-80 py-1"
          title={favorite ? "unfavorite" : "favorite"}
        >
          {favorite ? "\u2605" : "\u2606"}
        </button>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => updateStatus(s.value)}
              className={`font-mono text-xs px-3 py-2 rounded-full transition-colors ${
                status === s.value
                  ? "bg-cream text-bg"
                  : "bg-surface text-muted hover:text-cream"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Share */}
      <div className="flex items-center gap-6 mt-6">
        <button
          onClick={share}
          className="text-sm text-stone hover:text-cream transition-colors"
        >
          {copied ? "copied!" : "share"}
        </button>

        {item.offer_amount != null && (
          <div>
            <span className="font-mono text-xs text-muted">offer: </span>
            <span className="font-mono text-sm text-stone">
              ${Number(item.offer_amount) % 1 ? Number(item.offer_amount).toFixed(2) : Number(item.offer_amount)}
            </span>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mt-8 pt-8 border-t border-surface">
        <EditableNotes
          value={notes}
          onSave={(v) => {
            setNotes(v);
            return saveField("notes", v);
          }}
        />
      </div>

      {/* Delete */}
      <div className="mt-12">
        {deleting ? (
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted">are you sure?</span>
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.from("items").delete().eq("id", item.id);
                router.push(`/hunt/${huntId}`);
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              yes, delete
            </button>
            <button
              onClick={() => setDeleting(false)}
              className="text-xs text-muted hover:text-cream transition-colors"
            >
              cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleting(true)}
            className="text-xs text-muted hover:text-stone transition-colors"
          >
            delete item
          </button>
        )}
      </div>
    </div>
  );
}
