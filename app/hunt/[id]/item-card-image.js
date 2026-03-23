"use client";

import ImageUpload from "@/components/image-upload";

export default function ItemCardImage({ itemId, huntId }) {
  return (
    <ImageUpload
      itemId={itemId}
      huntId={huntId}
      className="w-full h-full flex items-center justify-center text-muted hover:text-stone transition-colors"
    >
      + image
    </ImageUpload>
  );
}
