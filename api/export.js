// GET /api/export?anahtar=GIZLI            → tüm kayıtlar, CSV (Excel'de açılır)
// GET /api/export?anahtar=GIZLI&bicim=json → aynısı, JSON
// GIZLI = Vercel ortam değişkeni LOG_ADMIN_KEY. Tanımlı değilse dışa aktarma kapalıdır.

const crypto = require("crypto");
const { komut, ANAHTAR } = require("./_redis");

const SUTUNLAR = ["sunucu_zamani", "istemci_zamani", "oturum", "olay", "mod", "secenek", "secenek_metni", "soru", "cevap"];

function anahtarDogru(verilen) {
  const gercek = process.env.LOG_ADMIN_KEY;
  if (!gercek || typeof verilen !== "string") return false;
  const a = Buffer.from(verilen);
  const b = Buffer.from(gercek);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function csvHucre(v) {
  const s = v === undefined || v === null ? "" : String(v);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

module.exports = async (req, res) => {
  if (!anahtarDogru(req.query.anahtar)) {
    return res.status(401).json({ hata: "Yetkisiz" });
  }
  let satirlar;
  try {
    satirlar = (await komut("LRANGE", ANAHTAR, 0, -1)).map((s) => {
      try { return JSON.parse(s); } catch { return { olay: "bozuk", cevap: s }; }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ hata: "Okunamadı" });
  }

  res.setHeader("Cache-Control", "no-store");
  if (req.query.bicim === "json") {
    return res.status(200).json(satirlar);
  }
  const csv = [SUTUNLAR.join(",")]
    .concat(satirlar.map((r) => SUTUNLAR.map((k) => csvHucre(r[k])).join(",")))
    .join("\r\n");
  const tarih = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="kayitlar-${tarih}.csv"`);
  // BOM: Excel Türkçe karakterleri UTF-8 olarak tanısın.
  return res.status(200).send("﻿" + csv + "\r\n");
};
