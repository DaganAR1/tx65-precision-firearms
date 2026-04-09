import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    const html = await response.text();
    
    // Basic cleanup to reduce token count
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
      .replace(/<[^>]*>?/gm, " ") // Replace tags with spaces
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim();
    
    res.status(200).json({ text: cleanHtml.substring(0, 10000) }); // Limit to 10k chars
  } catch (error: any) {
    console.error("Scrape Error:", error);
    res.status(500).json({ error: error.message });
  }
}
