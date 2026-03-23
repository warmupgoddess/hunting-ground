import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ItemImage from "@/components/item-image";
import HuntHeader from "./hunt-header";
import ChatBar from "@/components/chat-bar";
import ItemCardImage from "./item-card-image";

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
    <div className="min-h-screen px-5 py-4 max-w-2xl mx-auto pb-28">
      <Link href="/" className="block text-center mb-6" style={{ color: 'rgba(255,196,196,0.35)', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 900, fontSize: '24px' }}>
        ₹
      </Link>

      <HuntHeader hunt={hunt} />

      {activeItems.length > 0 && (
        <>
          <p className="text-muted mt-8 mb-4" style={{ fontSize: '18px', fontWeight: 200 }}>
            {activeItems.length} considering
          </p>
          <div className="grid grid-cols-2 gap-4">
            {activeItems.map((item) => (
              <Link
                key={item.id}
                href={`/hunt/${id}/item/${item.id}`}
                className="group"
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-surface relative">
                  {item.image_url ? (
                    <ItemImage
                      src={item.image_url}
                      alt={item.title || ""}
                      width={400}
                      height={533}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ItemCardImage itemId={item.id} huntId={id} />
                  )}
                  {item.is_favorite && (
                    <span className="absolute top-2 right-2 opacity-70">
                      &#9733;
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-1">
                    <p className="truncate">
                      {item.title || "untitled"}
                    </p>
                  </div>
                  {item.price != null && (
                    <p className="text-muted mt-0.5">
                      ${Number(item.price) % 1 ? Number(item.price).toFixed(2) : Number(item.price)}
                    </p>
                  )}
                  {item.source && (
                    <p className="text-muted mt-0.5 truncate">
                      {item.source}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {activeItems.length === 0 && (
        <p className="text-muted mt-8">no items yet.</p>
      )}

      {soldOutItems.length > 0 && (
        <div className="mt-12" style={{ opacity: 0.5 }}>
          <p className="text-muted mb-4" style={{ fontSize: '18px', fontWeight: 200 }}>
            {soldOutItems.length} out of the running
          </p>
          <div className="grid grid-cols-2 gap-4">
            {soldOutItems.map((item) => (
              <Link
                key={item.id}
                href={`/hunt/${id}/item/${item.id}`}
                className="group"
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-surface">
                  {item.image_url ? (
                    <ItemImage
                      src={item.image_url}
                      alt={item.title || ""}
                      width={400}
                      height={533}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ItemCardImage itemId={item.id} huntId={id} />
                  )}
                </div>
                <p className="truncate mt-2 line-through">
                  {item.title || "untitled"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ChatBar context="hunt" huntId={id} isEmpty={!items?.length} />
    </div>
  );
}
