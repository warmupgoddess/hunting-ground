"use server";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
};

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
      return { title: null, source: fallbackSource, price: null };
    }

    const html = await res.text();

    // Detect Cloudflare/bot challenge pages
    if (
      html.includes("Just a moment...") ||
      html.includes("cf-challenge") ||
      html.includes("challenge-platform")
    ) {
      return { title: null, source: fallbackSource, price: null };
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

    return {
      title: title ? title.trim() : null,
      source: source ? source.trim() : null,
      price,
    };
  } catch {
    return { title: null, source: fallbackSource, price: null };
  }
}
