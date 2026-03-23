import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ItemActions from "./item-actions";
import ChatBar from "@/components/chat-bar";

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
    <div className="min-h-screen pb-28 px-6 py-4 max-w-2xl mx-auto">
      <Link href={`/hunt/${id}`} className="block text-center" style={{ color: 'rgba(255,196,196,0.35)', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 900, fontSize: '24px' }}>
        ₹
      </Link>

      <div className="mt-6">
        {item.image_url && (
          <div
            className="w-full rounded-2xl overflow-hidden relative isolate"
            style={{ backgroundColor: '#ffffff', aspectRatio: '8/7' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={item.title || ""}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', borderRadius: '1rem' }}
            />
          </div>
        )}

        <div className="mt-5">
          <ItemActions item={item} huntId={id} />
        </div>
      </div>

      <ChatBar
        context="item"
        huntId={id}
        itemId={itemId}
        item={{ notes: item.notes }}
      />
    </div>
  );
}
