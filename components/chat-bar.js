"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { scrapeUrl } from "@/app/hunt/[id]/actions";

function isUrl(text) {
  if (/^https?:\/\//i.test(text)) return true;
  if (/\.(com|org|net|co|io|shop|store|me|app|dev|xyz)\b/i.test(text))
    return true;
  return false;
}

function ensureProtocol(url) {
  if (/^https?:\/\//i.test(url)) return url;
  return "https://" + url;
}

export default function ChatBar({
  context = "home",
  huntId = null,
  itemId = null,
  item = null,
  isEmpty = false,
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [localNotes, setLocalNotes] = useState(item?.notes || "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const fileRef = useRef(null);

  const placeholders = {
    home: "letz hunt, mrin",
    hunt: confirmingDelete
      ? "delete this hunt? type yes to confirm"
      : isEmpty
        ? "letz hunt, mrin"
        : "what's next?",
    item: "anything 2 add?",
  };

  async function getUser() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { supabase, user };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = value.trim();
    if (!text || loading) return;
    setLoading(true);

    // Hunt delete flow: two-step confirmation
    if (context === "hunt" && confirmingDelete) {
      if (text.toLowerCase() === "yes") {
        try {
          const { supabase } = await getUser();
          await supabase.from("items").delete().eq("hunt_id", huntId);
          await supabase.from("hunts").delete().eq("id", huntId);
          router.push("/");
        } catch (err) {
          console.error(err);
        }
      }
      setConfirmingDelete(false);
      setValue("");
      setLoading(false);
      return;
    }

    if (context === "hunt" && text.toLowerCase() === "delete") {
      setConfirmingDelete(true);
      setValue("");
      setLoading(false);
      return;
    }

    try {
      if (context === "home") {
        await handleHome(text);
      } else if (context === "hunt") {
        await handleHunt(text);
      } else if (context === "item") {
        await handleItem(text);
      }
    } catch (err) {
      console.error(err);
    }

    setValue("");
    setLoading(false);
  }

  async function handleHome(text) {
    const { supabase, user } = await getUser();

    if (isUrl(text)) {
      const url = ensureProtocol(text);
      const scraped = await scrapeUrl(url);

      const { data: hunt } = await supabase
        .from("hunts")
        .insert({
          name: scraped?.title || scraped?.source || "new hunt",
          user_id: user.id,
          status: "active",
        })
        .select()
        .single();

      if (hunt) {
        await supabase.from("items").insert({
          hunt_id: hunt.id,
          user_id: user.id,
          title: scraped?.title || null,
          url,
          price: scraped?.price || null,
          source: scraped?.source || null,
          status: "considering",
        });
        router.push(`/hunt/${hunt.id}`);
      }
    } else {
      const { data: hunt } = await supabase
        .from("hunts")
        .insert({
          name: text,
          vibe: text,
          user_id: user.id,
          status: "active",
        })
        .select()
        .single();

      if (hunt) {
        router.push(`/hunt/${hunt.id}`);
      }
    }
  }

  async function handleHunt(text) {
    const { supabase, user } = await getUser();

    if (isUrl(text)) {
      const url = ensureProtocol(text);
      const scraped = await scrapeUrl(url);

      await supabase.from("items").insert({
        hunt_id: huntId,
        user_id: user.id,
        title: scraped?.title || null,
        url,
        price: scraped?.price || null,
        source: scraped?.source || null,
        status: "considering",
      });

      await supabase
        .from("hunts")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", huntId);

      router.refresh();
    } else {
      const { data: hunt } = await supabase
        .from("hunts")
        .select("vibe")
        .eq("id", huntId)
        .single();

      const existing = hunt?.vibe || "";
      const updated = existing ? existing + "\n" + text : text;

      await supabase
        .from("hunts")
        .update({ vibe: updated, updated_at: new Date().toISOString() })
        .eq("id", huntId);

      window.dispatchEvent(
        new CustomEvent("vibe-updated", { detail: { vibe: updated } })
      );
      router.refresh();
    }
  }

  async function handleItem(text) {
    const { supabase } = await getUser();

    if (isUrl(text)) {
      const url = ensureProtocol(text);
      await supabase.from("items").update({ url }).eq("id", itemId);
      await supabase
        .from("hunts")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", huntId);
      router.refresh();
    } else {
      const existing = localNotes;
      const updated = existing ? existing + "\n" + text : text;
      setLocalNotes(updated);

      await supabase.from("items").update({ notes: updated }).eq("id", itemId);
      await supabase
        .from("hunts")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", huntId);

      window.dispatchEvent(
        new CustomEvent("notes-updated", { detail: { notes: updated } })
      );
      router.refresh();
    }
  }

  async function handleFileUpload(file) {
    if (!file) return;
    setLoading(true);

    try {
      const { supabase, user } = await getUser();
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

      if (context === "home") {
        const { data: hunt } = await supabase
          .from("hunts")
          .insert({
            name: "new hunt",
            user_id: user.id,
            status: "active",
          })
          .select()
          .single();

        if (hunt) {
          await supabase.from("items").insert({
            hunt_id: hunt.id,
            user_id: user.id,
            image_url: publicUrl,
            status: "considering",
          });
          router.push(`/hunt/${hunt.id}`);
        }
      } else if (context === "hunt") {
        await supabase.from("items").insert({
          hunt_id: huntId,
          user_id: user.id,
          image_url: publicUrl,
          status: "considering",
        });

        await supabase
          .from("hunts")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", huntId);

        router.refresh();
      } else if (context === "item") {
        await supabase
          .from("items")
          .update({ image_url: publicUrl })
          .eq("id", itemId);

        await supabase
          .from("hunts")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", huntId);

        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingTop: "0.5rem",
      }}
    >
      <div className="max-w-2xl mx-auto px-4">
        <form onSubmit={handleSubmit} className="relative flex items-center" >
          {/* Cat ears — rendered before pill so pill covers their base */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '8%',
              width: '5.5vw',
              maxWidth: '36px',
              aspectRatio: '1/2',
              background: '#2A2A2A',
              transform: 'rotate(45deg)',
              borderRadius: '8px 8px 0 8px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              right: '8%',
              width: '5.5vw',
              maxWidth: '36px',
              aspectRatio: '1/2',
              background: '#2A2A2A',
              transform: 'rotate(45deg)',
              borderRadius: '8px 8px 8px 0',
            }}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholders[context]}
            disabled={loading}
            className="w-full pl-4 pr-12 py-3 rounded-full text-center text-cream placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-white/10 disabled:opacity-50"
            style={{
              fontSize: "18px",
              fontWeight: 200,
              background: "#2A2A2A",
              border: "none",
              position: "relative",
              zIndex: 1,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="absolute right-3 flex items-center justify-center text-muted hover:text-cream transition-colors disabled:opacity-50"
            style={{ fontSize: '18px', lineHeight: 1, zIndex: 2 }}
          >
            &#9829;
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />
        </form>
      </div>
    </div>
  );
}
