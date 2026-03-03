import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ItemImage from "@/components/item-image";

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }) + " at " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).replace(/\s?(AM|PM)/, "$1");
}

const LIST_LIMIT = 5;

export default async function Home() {
  const supabase = await createClient();
  const { data: hunts } = await supabase
    .from("hunts")
    .select("*, items(id, image_url, status, is_favorite)")
    .order("updated_at", { ascending: false })
    .order("created_at", { referencedTable: "items", ascending: false });

  const featured = hunts?.[0];
  const rest = hunts?.slice(1) || [];
  const visible = rest.slice(0, LIST_LIMIT);
  const remaining = rest.length - LIST_LIMIT;

  return (
    <div className="min-h-screen px-6 pt-8 pb-12 max-w-2xl mx-auto">
      <div style={{ paddingBottom: '4rem' }}>
        <h1
          className="text-center"
          style={{
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: 900,
            letterSpacing: '0.12em',
            fontSize: 'clamp(1.6rem, 5.5vw, 2.5rem)',
            lineHeight: 1.1,
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
            background: 'linear-gradient(180deg, rgba(255,196,196,0.15) 0%, rgba(255,196,196,0.35) 45%, rgba(255,196,196,0.18) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            textAlign: 'center',
          }}
        >
          hunting groundz₹
        </h1>
      </div>

      {!hunts?.length ? (
        <div className="mt-20">
          <p className="text-stone text-sm">nothing here yet.</p>
        </div>
      ) : (
        <div>
          {featured && (
            <Link href={`/hunt/${featured.id}`} className="block" style={{ marginBottom: '5rem' }}>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-xl font-bold">{featured.name}</h2>
                <span className="text-muted text-[11px] whitespace-nowrap">
                  {formatDate(featured.updated_at)}
                </span>
              </div>
              {featured.vibe && (
                <p className="text-stone text-sm mt-2 line-clamp-2">
                  {featured.vibe}
                </p>
              )}

              {featured.items?.some((i) => i.image_url) && (
                <div className="flex gap-3 mt-5 overflow-x-auto no-scrollbar pb-2">
                  {featured.items
                    .filter((i) => i.image_url)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] flex-shrink-0 rounded-lg overflow-hidden bg-surface"
                      >
                        <ItemImage
                          src={item.image_url}
                          alt=""
                          width={150}
                          height={150}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                </div>
              )}

              <div className="flex gap-3 mt-3 text-sm text-muted">
                <span>{featured.items?.length || 0} items</span>
                <span>
                  {featured.items?.filter((i) => i.is_favorite).length || 0}{" "}
                  favorites
                </span>
                <span>{featured.status}</span>
              </div>
            </Link>
          )}

          {visible.length > 0 && (
            <div className="flex flex-col">
              {visible.map((hunt) => (
                <Link
                  key={hunt.id}
                  href={`/hunt/${hunt.id}`}
                  className="flex items-center justify-between py-2 group"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-base tracking-widest lowercase group-hover:text-cream transition-colors">
                      {hunt.name}
                    </span>
                    <span className="text-xs text-muted">
                      {hunt.items?.length || 0}
                    </span>
                  </div>
                  <span className="text-muted text-base group-hover:text-stone transition-colors">
                    &rarr;
                  </span>
                </Link>
              ))}

              {remaining > 0 && (
                <p className="text-muted text-xs mt-3">
                  show all active hunts ({rest.length})
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center mt-12">
        <Link
          href="/new"
          className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-muted hover:text-cream hover:border-stone transition-colors text-lg"
        >
          +
        </Link>
      </div>
    </div>
  );
}
