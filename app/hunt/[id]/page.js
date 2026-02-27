import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ItemImage from "@/components/item-image";
import AddItemModal from "./add-item-modal";
import HuntHeader from "./hunt-header";

export default async function HuntDetail({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: hunt } = await supabase
    .from("hunts")
    .select("*")
    .eq("id", id)
    .single();

  if (!hunt) notFound();

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("hunt_id", id)
    .order("created_at", { ascending: false });

  const activeItems = items?.filter((i) => i.status !== "sold_out") || [];
  const soldOutItems = items?.filter((i) => i.status === "sold_out") || [];

  return (
    <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto pb-28">
      <Link
        href="/"
        className="text-muted text-sm mb-10 block hover:text-stone transition-colors"
      >
        &larr; hunts
      </Link>

      <HuntHeader hunt={hunt} />

      {activeItems.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-8">
          {activeItems.map((item) => (
            <Link
              key={item.id}
              href={`/hunt/${id}/item/${item.id}`}
              className="group"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-surface relative">
                {item.image_url ? (
                  <ItemImage
                    src={item.image_url}
                    alt={item.title || ""}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                    no image
                  </div>
                )}
                {item.is_favorite && (
                  <span className="absolute top-2 right-2 text-sm opacity-70">
                    &#9733;
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-1">
                  <p className="text-sm truncate">
                    {item.title || "untitled"}
                  </p>
                </div>
                {item.price != null && (
                  <p className="font-mono text-xs text-muted mt-0.5">
                    ${Number(item.price).toFixed(0)}
                  </p>
                )}
                {item.source && (
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {item.source}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeItems.length === 0 && (
        <p className="text-muted text-sm mt-8">no items yet.</p>
      )}

      {soldOutItems.length > 0 && (
        <div className="mt-12 opacity-40">
          <p className="font-mono text-xs text-muted mb-4">gone</p>
          <div className="grid grid-cols-2 gap-4">
            {soldOutItems.map((item) => (
              <Link
                key={item.id}
                href={`/hunt/${id}/item/${item.id}`}
                className="group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-surface">
                  {item.image_url ? (
                    <ItemImage
                      src={item.image_url}
                      alt={item.title || ""}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                      no image
                    </div>
                  )}
                </div>
                <p className="text-sm truncate mt-2 line-through">
                  {item.title || "untitled"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <AddItemModal huntId={id} />
    </div>
  );
}
