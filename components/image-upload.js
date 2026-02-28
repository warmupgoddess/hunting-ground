"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ImageUpload({
  itemId,
  huntId,
  hasImage = false,
  children,
  className = "",
}) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("item-images")
      .upload(path, file);

    if (uploadError) {
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("item-images").getPublicUrl(path);

    await supabase
      .from("items")
      .update({ image_url: publicUrl })
      .eq("id", itemId);

    await supabase
      .from("hunts")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", huntId);

    setUploading(false);
    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  function trigger(e) {
    e.preventDefault();
    e.stopPropagation();
    inputRef.current?.click();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={trigger}
        disabled={uploading}
        className={className}
        type="button"
      >
        {uploading ? "uploading..." : children}
      </button>
    </>
  );
}
