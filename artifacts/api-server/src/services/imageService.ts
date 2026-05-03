import axios from "axios";

export async function searchImageUrl(query: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;

  if (apiKey && cx) {
    try {
      const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
        params: {
          key: apiKey,
          cx,
          q: `${query} single perfume bottle no box luxury hq official product photo white background`,
          searchType: "image",
          num: 1,
          imgSize: "large",
          safe: "active"
        }
      });
      const firstImage = response.data?.items?.[0]?.link;
      if (firstImage) return firstImage;
    } catch {
      // fall through to Bing
    }
  }

  try {
    const cleanQuery = query.trim().replace(/\s+/g, ' ');
    const bingQuery = `${cleanQuery} single fragrance bottle no box HQ product isolated white background`;
    const res = await fetch(`https://www.bing.com/images/search?q=${encodeURIComponent(bingQuery)}&form=HDRSC2&first=1`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    if (res.ok) {
      const text = await res.text();
      const matches = [...text.matchAll(/murl&quot;:&quot;(https?:\/\/[^&"]+?)&quot;/g)];
      if (matches.length > 0) {
        const urls = matches.map(m => m[1]);
        const badHosts = ["dreamstime", "alamy", "shutterstock", "freepik", "istock", "pixelsquid", "123rf", "vecteezy", "ebay", "poshmark", "pinterest", "etsy"];
        const highTrustHosts = ["fragrantica.com", "fimgs.net", "sephora.com", "chanel.com", "dior.com", "nordstrom", "neimanmarcus", "bloomingdales", "ulta.com", "macys.com", "harrods.com"];
        const highTrustUrl = urls.find(u => highTrustHosts.some(h => u.toLowerCase().includes(h)));
        if (highTrustUrl) return highTrustUrl;
        const filtered = urls.filter(u => !badHosts.some(bh => u.toLowerCase().includes(bh)));
        if (filtered.length > 0) return filtered.find(u => /\.(jpg|png|webp|jpeg)(\?.*)?$/i.test(u)) || filtered[0];
        return matches[0][1];
      }
    }
  } catch {
    // fall through to Unsplash
  }

  const q = query.toLowerCase();
  const searchTerms = q.replace(/[^a-z0-9]/g, '+');
  let photoId = "";
  if (q.includes("chanel") || q.includes("n°5")) photoId = "vInYhC07U1Q";
  else if (q.includes("dior") || q.includes("sauvage")) photoId = "1523293182086-7651a899d37f";
  else if (q.includes("versace")) photoId = "1594035910387-fea47794261f";
  if (photoId) return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&q=100&w=1200`;
  return `https://images.unsplash.com/featured/?perfume,bottle,${searchTerms}&auto=format&fit=crop&q=100&w=1200`;
}
