const RATE_LIMIT = {};

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limiting：同一 IP 每分鐘最多 10 次
  const ip = req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  if (!RATE_LIMIT[ip]) RATE_LIMIT[ip] = [];
  RATE_LIMIT[ip] = RATE_LIMIT[ip].filter(t => now - t < 60000);
  if (RATE_LIMIT[ip].length >= 10) {
    return res.status(429).json({ error: "Too many requests, please slow down" });
  }
  RATE_LIMIT[ip].push(now);

  const { query, lang = "zh-TW" } = req.query;
  if (!query) return res.status(400).json({ error: "Missing query parameter" });

  try {
    const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(query)}&key=${process.env.API_KEY}&languageCode=${lang}`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data.claims || []);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}
