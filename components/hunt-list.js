"use client";

import { useState } from "react";
import Link from "next/link";

export default function HuntList({ allHunts, featured, featuredContent, limit }) {
  const [expanded, setExpanded] = useState(false);
  const rest = allHunts.slice(1);
  const hasMore = rest.length > limit;

  if (expanded) {
    return (
      <div className="flex flex-col">
        {allHunts.map((hunt) => (
          <Link
            key={hunt.id}
            href={`/hunt/${hunt.id}`}
            className="flex items-center justify-between py-2 group"
          >
            <div className="flex items-baseline gap-3">
              <span className="lowercase group-hover:text-cream transition-colors" style={{ fontSize: '18px', fontWeight: 200, letterSpacing: '0.15em' }}>
                {hunt.name}
              </span>
              <span className="text-muted">
                {hunt.items?.length || 0}
              </span>
            </div>
            <span className="text-muted group-hover:text-stone transition-colors" style={{ fontSize: '18px', fontWeight: 200 }}>
              &rarr;
            </span>
          </Link>
        ))}
        <button
          onClick={() => setExpanded(false)}
          className="text-muted mt-3 text-left hover:text-stone transition-colors"
        >
          show less
        </button>
      </div>
    );
  }

  return (
    <div>
      {featuredContent}

      {rest.length > 0 && (
        <div className="flex flex-col">
          {rest.slice(0, limit).map((hunt) => (
            <Link
              key={hunt.id}
              href={`/hunt/${hunt.id}`}
              className="flex items-center justify-between py-2 group"
            >
              <div className="flex items-baseline gap-3">
                <span className="lowercase group-hover:text-cream transition-colors" style={{ fontSize: '18px', fontWeight: 200, letterSpacing: '0.15em' }}>
                  {hunt.name}
                </span>
                <span className="text-muted">
                  {hunt.items?.length || 0}
                </span>
              </div>
              <span className="text-muted group-hover:text-stone transition-colors" style={{ fontSize: '18px', fontWeight: 200 }}>
                &rarr;
              </span>
            </Link>
          ))}

          {hasMore && (
            <button
              onClick={() => setExpanded(true)}
              className="text-muted mt-3 text-left hover:text-stone transition-colors"
            >
              show all active hunts ({allHunts.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
