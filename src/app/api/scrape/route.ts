import { NextRequest } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {

  const { url } = await req.json();
  if (!url) return Response.json({ error: "URL is required" }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WishlyBot/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return Response.json({ error: "Could not fetch URL" }, { status: 422 });

    const html = await res.text();
    const $ = cheerio.load(html);

    const get = (selectors: string[]) => {
      for (const s of selectors) {
        const val = $(s).first().attr("content") ?? $(s).first().text();
        if (val?.trim()) return val.trim();
      }
      return undefined;
    };

    const title = get([
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      "title",
    ]);

    const imageUrl = get([
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ]);

    const description = get([
      'meta[property="og:description"]',
      'meta[name="description"]',
    ]);

    // Best-effort price extraction from common patterns
    const priceText =
      $('[itemprop="price"]').attr("content") ??
      $('[class*="price"]').first().text().trim();

    const priceMatch = priceText?.match(/[\d.,]+/);
    const price = priceMatch ? priceMatch[0].replace(",", ".") : undefined;

    return Response.json({ title, imageUrl, description, price });
  } catch {
    return Response.json({ error: "Failed to scrape URL" }, { status: 422 });
  }
}
