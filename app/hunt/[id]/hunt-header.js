"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function EditableText({
  value,
  onSave,
  displayValue,
  placeholder,
  inputClassName = "",
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEdit(e) {
    e.preventDefault();
    e.stopPropagation();
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
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        autoFocus
        placeholder={placeholder}
        className={`bg-surface text-cream px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-stone ${inputClassName}`}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      className="cursor-pointer hover:opacity-70 transition-opacity"
      title="click to edit"
    >
      {displayValue}
    </span>
  );
}

function EditableVibe({ value, onSave, placeholder }) {
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

  function startEdit(e) {
    e.preventDefault();
    e.stopPropagation();
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

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        autoFocus
        placeholder={placeholder}
        rows={3}
        className="w-full bg-surface text-cream px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-stone resize-none mt-1"
      />
    );
  }

  return (
    <div
      onClick={startEdit}
      className="cursor-pointer hover:opacity-70 transition-opacity mt-1"
      title="click to edit"
    >
      {display ? (
        <div
          className="text-stone text-sm"
          style={{ whiteSpace: "pre-line" }}
        >
          {display}
        </div>
      ) : (
        <p className="text-muted text-sm">
          {placeholder}
        </p>
      )}
    </div>
  );
}

export default function HuntHeader({ hunt }) {
  const router = useRouter();
  const [name, setName] = useState(hunt.name);
  const [vibe, setVibe] = useState(hunt.vibe || "");

  async function saveField(field, value) {
    const supabase = createClient();
    await supabase
      .from("hunts")
      .update({ [field]: value || null })
      .eq("id", hunt.id);
    router.refresh();
  }

  return (
    <div>
      <EditableText
        value={name}
        onSave={(v) => {
          setName(v);
          return saveField("name", v);
        }}
        displayValue={<h1 className="text-2xl">{name}</h1>}
        placeholder="hunt name"
        inputClassName="text-2xl w-full"
      />
      <EditableVibe
        value={vibe}
        onSave={(v) => {
          setVibe(v);
          return saveField("vibe", v);
        }}
        placeholder="add a vibe..."
      />
    </div>
  );
}
