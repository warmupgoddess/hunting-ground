"use server";

import { createClient } from "@/lib/supabase/server";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
};

function findBestImage(html, pageUrl) {
  const candidates = [];

  // 1. og:image
  const ogImage =
    html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    )?.[1] ??
    html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
    )?.[1];
  if (ogImage) {
    candidates.push({ url: ogImage, score: 50 });
  }

  // 2. Scan <img> tags for high-res product images
  const imgRegex =
    /<img\s[^>]*?\bsrc=["']([^"']+)["'][^>]*?>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const tag = match[0];
    const src = match[1];

    // Skip tiny icons, trackers, base64
    if (
      src.startsWith("data:") ||
      /\.(svg|gif|ico)(\?|$)/i.test(src) ||
      /pixel|track|beacon|spacer|blank/i.test(src)
    ) {
      continue;
    }

    let score = 0;

    // Boost for product/listing keywords in src
    if (/product|listing|item|main|primary|hero|large|full/i.test(src)) {
      score += 30;
    }

    // Check width/height attributes
    const w = tag.match(/\bwidth=["']?(\d+)/i)?.[1];
    const h = tag.match(/\bheight=["']?(\d+)/i)?.[1];
    const width = w ? parseInt(w, 10) : 0;
    const height = h ? parseInt(h, 10) : 0;

    if (width >= 500 || height >= 500) {
      score += 40;
    } else if (width >= 300 || height >= 300) {
      score += 20;
    } else if (width > 0 && width < 100) {
      // Small image, skip
      continue;
    }

    // Boost for resolution hints in URL
    if (/[\/_-](1200|1000|800|large|full|orig)/i.test(src)) {
      score += 20;
    }

    if (score > 0) {
      candidates.push({ url: src, score });
    }
  }

  if (candidates.length === 0) return null;

  // Pick highest scoring candidate
  candidates.sort((a, b) => b.score - a.score);
  let bestUrl = candidates[0].url;

  // Resolve relative URLs
  try {
    bestUrl = new URL(bestUrl, pageUrl).href;
  } catch {
    return null;
  }

  return bestUrl;
}

async function downloadImageToSupabase(imageUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return null;

    const buffer = Buffer.from(await res.arrayBuffer());

    // Determine extension from content type
    const extMap = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif",
    };
    const ext = extMap[contentType.split(";")[0]] || "jpg";
    const path = `scraped/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const supabase = await createClient();
    const { error } = await supabase.storage
      .from("item-images")
      .upload(path, buffer, { contentType: contentType.split(";")[0] });

    if (error) return null;

    const {
      data: { publicUrl },
    } = supabase.storage.from("item-images").getPublicUrl(path);

    return publicUrl;
  } catch {
    return null;
  }
}

export async function scrapeUrl(url) {
  // Always extract domain as fallback source
  let fallbackSource = null;
  try {
    fallbackSource = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      // Site blocked us — still return the domain as source
      return { title: null, image: null, source: fallbackSource, price: null };
    }

    const html = await res.text();

    // Detect Cloudflare/bot challenge pages
    if (
      html.includes("Just a moment...") ||
      html.includes("cf-challenge") ||
      html.includes("challenge-platform")
    ) {
      return { title: null, image: null, source: fallbackSource, price: null };
    }

    // og:title or <title>
    const ogTitle =
      html.match(
        /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
      )?.[1] ??
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i
      )?.[1];
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    const title = ogTitle || titleTag || null;

    // og:site_name or domain
    const ogSiteName =
      html.match(
        /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i
      )?.[1] ??
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i
      )?.[1];
    const source = ogSiteName || fallbackSource;

    // price
    const priceMatch =
      html.match(
        /<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i
      )?.[1] ??
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']product:price:amount["']/i
      )?.[1] ??
      html.match(
        /<meta[^>]*property=["']og:price:amount["'][^>]*content=["']([^"']+)["']/i
      )?.[1] ??
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:price:amount["']/i
      )?.[1];
    const priceText =
      priceMatch ?? html.match(/\$(\d{1,6}(?:\.\d{2})?)/)?.[1] ?? null;
    const price = priceText ? parseFloat(priceText) : null;

    // Find best image and download to Supabase
    const bestImageUrl = findBestImage(html, url);
    let image = null;
    if (bestImageUrl) {
      image = await downloadImageToSupabase(bestImageUrl);
    }

    return {
      title: title ? title.trim() : null,
      image,
      source: source ? source.trim() : null,
      price,
    };
  } catch {
    // Network error — still return domain
    return { title: null, image: null, source: fallbackSource, price: null };
  }
}
