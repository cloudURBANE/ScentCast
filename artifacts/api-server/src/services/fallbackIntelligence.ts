import axios from 'axios';

export async function deepScrapeFragrance(query: string) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + " perfume or fragrance")}&utf8=&format=json`;
    const res = await axios.get(searchUrl, { headers: { 'User-Agent': 'OlfactoryApp/1.0' } });

    let snippet = '';
    if (res.data?.query?.search?.length > 0) {
      snippet = res.data.query.search.map((s: any) => s.snippet).join(' ').replace(/<[^>]+>/g, '');
    }

    const lowerSnippet = snippet.toLowerCase();
    const possibleNotes = ['vanilla', 'rose', 'sandalwood', 'bergamot', 'lemon', 'patchouli', 'musk', 'jasmine', 'oud', 'amber', 'cedar', 'vetiver', 'leather', 'tonka', 'lavender', 'iris', 'pear', 'apple', 'pepper', 'neroli', 'tuberose', 'ylang', 'cardamom', 'citrus', 'wood'];
    const foundNotes = possibleNotes.filter(n => lowerSnippet.includes(n));

    const parts = query.split(' ');
    const brand = parts[0] || "Unknown";
    const name = parts.slice(1).join(' ') || parts[0];

    return {
      name,
      brand,
      notes: foundNotes.length > 0 ? foundNotes : ['Citrus', 'Wood', 'Musk'],
      family: foundNotes.includes('wood') || foundNotes.includes('sandalwood') ? 'Woody' : (foundNotes.includes('rose') || foundNotes.includes('jasmine') ? 'Floral' : 'Fresh'),
      description: snippet ? `${snippet.substring(0, 200)}...` : `Standard profile for ${query}.`
    };
  } catch {
    const parts = query.split(' ');
    return {
      name: parts.slice(1).join(' ') || parts[0],
      brand: parts[0] || "Unknown",
      notes: ['Citrus', 'Wood', 'Musk'],
      family: 'Fresh',
      description: `Basic heuristic profile for ${query}.`
    };
  }
}
