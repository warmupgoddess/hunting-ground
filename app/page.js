import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ItemImage from "@/components/item-image";

export default async function Home() {
  const supabase = await createClient();
  const { data: hunts } = await supabase
    .from("hunts")
    .select("*, items(id, image_url, status, is_favorite)")
    .order("updated_at", { ascending: false });

  const vivid = hunts?.[0];
  const rest = hunts?.slice(1) || [];

  return (
    <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <h1 className="font-serif text-2xl mb-10">hunting ground</h1>

      {!hunts?.length ? (
        <div className="mt-20">
          <p className="text-stone text-sm">nothing here yet.</p>
        </div>
      ) : (
        <div>
          {vivid && (
            <Link href={`/hunt/${vivid.id}`} className="block mb-12">
              <h2 className="font-serif text-xl">{vivid.name}</h2>
              {vivid.vibe && (
                <p className="font-serif italic text-stone text-sm mt-1 line-clamp-2">
                  {vivid.vibe}
                </p>
              )}
              <div className="flex gap-3 mt-2 font-mono text-xs text-muted">
                <span>{vivid.items?.length || 0} items</span>
                <span>
                  {vivid.items?.filter((i) => i.is_favorite).length ||
                    0}{" "}
                  favorites
                </span>
                <span>{vivid.status}</span>
              </div>

              {vivid.items?.some((i) => i.image_url) && (
                <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar pb-2">
                  {vivid.items
                    .filter((i) => i.image_url)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-surface"
                      >
                        <ItemImage
                          src={item.image_url}
                          alt=""
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                </div>
              )}
            </Link>
          )}

          {rest.length > 0 && (
            <div className="flex flex-col gap-1">
              {rest.map((hunt) => (
                <Link
                  key={hunt.id}
                  href={`/hunt/${hunt.id}`}
                  className="flex items-center justify-between py-3 group"
                >
                  <div>
                    <span className="font-serif text-sm group-hover:text-cream transition-colors">
                      {hunt.name}
                    </span>
                    <span className="font-mono text-xs text-muted ml-3">
                      {hunt.items?.length || 0}
                    </span>
                  </div>
                  <span className="text-muted text-sm group-hover:text-stone transition-colors">
                    &rarr;
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <Link
        href="/new"
        className="block mt-12 text-stone text-sm hover:text-cream transition-colors"
      >
        start a new hunt
      </Link>
    </div>
  );
}
