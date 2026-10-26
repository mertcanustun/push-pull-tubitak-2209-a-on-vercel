// POST /api/log — oyundan gelen tek bir olayı kaydeder.
// Gövde (JSON): { oturum, olay, mod, secenek, secenek_metni, soru, cevap, istemci_zamani }
// Yalnızca bu alanlar saklanır; her biri MAKS_UZUNLUK karakterde kesilir.

const { komut, ANAHTAR } = require("./_redis");

const ALANLAR = ["oturum", "olay", "mod", "secenek", "secenek_metni", "soru", "cevap", "istemci_zamani"];
const OLAYLAR = new Set(["oturum_basladi", "secim", "cevap", "cevap_gecildi"]);
const MAKS_UZUNLUK = 2000;
const MAKS_GOVDE = 16 * 1024;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ hata: "Yalnızca POST" });
  }
  if (Number(req.headers["content-length"] || 0) > MAKS_GOVDE) {
    return res.status(413).json({ hata: "Gövde çok büyük" });
  }
  let govde = req.body;
  if (typeof govde === "string") {
    try { govde = JSON.parse(govde); } catch { govde = null; }
  }
  if (!govde || typeof govde !== "object" || !OLAYLAR.has(govde.olay)) {
    return res.status(400).json({ hata: "Geçersiz olay" });
  }

  const kayit = { sunucu_zamani: new Date().toISOString() };
  for (const a of ALANLAR) {
    if (govde[a] !== undefined && govde[a] !== null) kayit[a] = String(govde[a]).slice(0, MAKS_UZUNLUK);
  }

  try {
    await komut("RPUSH", ANAHTAR, JSON.stringify(kayit));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ hata: "Kaydedilemedi" });
  }
  return res.status(204).end();
};
