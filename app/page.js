import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ItemImage from "@/components/item-image";
import ChatBar from "@/components/chat-bar";
import Onboarding from "@/components/onboarding";
import HuntList from "@/components/hunt-list";

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

  return (
    <div className="min-h-screen px-6 pt-8 pb-24 max-w-2xl mx-auto">
      <div style={{ paddingBottom: '4rem' }}>
        <h1
          className="text-center"
          style={{
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: 400,
            letterSpacing: '-0.11em',
            fontSize: '32px',
            lineHeight: 1.1,
            color: 'rgba(255, 255, 255, 0.15)',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {"hunting"}
          <span
            style={{
              display: 'inline-block',
              position: 'relative',
              fontSize: '64px',
              verticalAlign: 'middle',
              lineHeight: 1,
              margin: '0 -4px',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              background: 'linear-gradient(180deg, rgba(255,196,196,0.4) 0%, rgba(255,196,196,0.6) 40%, rgba(255,196,196,0.15) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 18px rgba(255, 255, 255, 0.12)) drop-shadow(0 8px 12px rgba(0, 0, 0, 0.6))',
              textShadow: 'none',
              letterSpacing: 'normal',
              fontWeight: 900,
            }}
          >
            ₹
          </span>
          {"groundz"}
        </h1>
      </div>

      {!hunts?.length ? (
        <Onboarding />
      ) : (
        <HuntList
          allHunts={hunts}
          limit={LIST_LIMIT}
          featuredContent={
            featured && (
              <Link href={`/hunt/${featured.id}`} className="block" style={{ marginBottom: '5rem' }}>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 style={{ fontSize: '24px', fontWeight: 500 }}>{featured.name}</h2>
                  <span className="text-muted whitespace-nowrap">
                    {formatDate(featured.updated_at)}
                  </span>
                </div>
                {featured.vibe && (
                  <p className="text-stone mt-2 line-clamp-2">
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

                <div className="flex gap-3 mt-3 text-muted" style={{ fontSize: '18px', fontWeight: 200 }}>
                  <span>{featured.items?.length || 0} items</span>
                  <span>
                    {featured.items?.filter((i) => i.is_favorite).length || 0}{" "}
                    favorites
                  </span>
                  <span>{featured.status}</span>
                </div>
              </Link>
            )
          }
        />
      )}

      {hunts?.length > 0 && <ChatBar context="home" />}
    </div>
  );
}
