import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ItemImage from "@/components/item-image";
import ImageUpload from "@/components/image-upload";
import Link from "next/link";
import ItemActions from "./item-actions";

export default async function ItemDetail({ params }) {
  const { id, itemId } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (!item) notFound();

  return (
    <div className="min-h-screen pb-24 px-6 py-4 max-w-3xl mx-auto">
      <Link
        href={`/hunt/${id}`}
        className="text-muted text-sm hover:text-stone transition-colors"
      >
        &larr; back
      </Link>

      <div className="mt-6 flex flex-col md:flex-row md:gap-10">
        <div className="flex-shrink-0 mx-auto md:mx-0">
          {item.image_url ? (
            <div className="relative group">
              <div
                className="w-full max-w-xs aspect-[3/4] rounded-lg overflow-hidden"
                style={{ backgroundColor: "#1a1a18" }}
              >
                <div className="p-2 h-full">
                  <ItemImage
                    src={item.image_url}
                    alt={item.title || ""}
                    width={320}
                    height={427}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              </div>
              <ImageUpload
                itemId={item.id}
                huntId={id}
                hasImage
                className="absolute bottom-3 right-3 text-xs text-muted bg-bg/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:text-cream"
              >
                change image
              </ImageUpload>
            </div>
          ) : (
            <div
              className="w-full max-w-xs aspect-[3/4] rounded-lg overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: "#1a1a18" }}
            >
              <ImageUpload
                itemId={item.id}
                huntId={id}
                className="text-sm text-muted hover:text-stone transition-colors py-2 px-4"
              >
                upload image
              </ImageUpload>
            </div>
          )}
        </div>

        <div className="mt-6 md:mt-0 flex-1 min-w-0">
          <ItemActions item={item} huntId={id} />
        </div>
      </div>
    </div>
  );
}
