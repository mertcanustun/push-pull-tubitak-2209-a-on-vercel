// Upstash Redis REST istemcisi (bağımlılık yok, yalnızca fetch).
// Vercel → Storage → Upstash (Redis) bağlandığında ortam değişkenleri
// kendiliğinden eklenir: KV_REST_API_URL / KV_REST_API_TOKEN
// (eski adlar UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN da olur).

const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Tüm olaylar bu listede tutulur (RPUSH ile sona eklenir).
const ANAHTAR = "kayitlar";

async function komut(...args) {
  if (!URL || !TOKEN) {
    throw new Error("Redis bağlı değil: KV_REST_API_URL / KV_REST_API_TOKEN eksik.");
  }
  const r = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(`Redis hatası: ${j.error || r.status}`);
  return j.result;
}

module.exports = { komut, ANAHTAR };
