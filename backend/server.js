require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

const pool = require("./db");

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.error("DB TEST ERROR:", err);
    res.status(500).json({
      message: "DB error",
      error: err.message,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("API calisiyor");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});

// =========================
// JWT TOKEN ÜRET
// =========================
function generateToken(user) {
  return jwt.sign(
    {
      username: user.username,
      ad_soyad: user.ad_soyad,
      rol: user.rol,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
  );
}

// =========================
// AUTH MIDDLEWARE
// =========================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token yok" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token yok" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Geçersiz token" });
  }
}

// =========================
// LOGIN
// =========================
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  let user = null;

  // BÖLGE MÜDÜRLERİ
  if (
    username === "murat.nabitoglu@simsektel.com" &&
    password === "Simsek2026Antalya"
  ) {
    user = {
      username: "murat.nabitoglu@simsektel.com",
      ad_soyad: "Murat Nabitoğlu",
      rol: "BOLGE_MUDURU",
    };
  } else if (
    username === "serdar.altinova@simsektel.com" &&
    password === "Simsek2026Izmir"
  ) {
    user = {
      username: "serdar.altinova@simsektel.com",
      ad_soyad: "Serdar Altınova",
      rol: "BOLGE_MUDURU",
    };
  }

  // ROLLOUT MANAGER
  else if (
    username === "nurcan.kus@simsektel.com" &&
    password === "RMSimsek2026Bursa"
  ) {
    user = {
      username: "nurcan.kus@simsektel.com",
      ad_soyad: "Nurcan Kuş",
      rol: "ROLLOUT_MANAGER",
    };
  }

  // PROJE MÜDÜRÜ
  else if (
    username === "orhan.bedir@simsektel.com" &&
    password === "PMSimsek2026Bursa"
  ) {
    user = {
      username: "orhan.bedir@simsektel.com",
      ad_soyad: "Orhan Bedir",
      rol: "PROJE_MUDURU",
    };
  }

  // PROJE DİREKTÖRÜ
  else if (
    username === "duzgun.simsek@simsektel.com" &&
    password === "PDRMSimsek2026Bursa"
  ) {
    user = {
      username: "duzgun.simsek@simsektel.com",
      ad_soyad: "Düzgün Şimşek",
      rol: "PROJE_DIREKTORU",
    };
  }

  // MUHASEBE
  else if (
    username === "muhasebe@simsektel.com" &&
    password === "MuhasebeSimsek2026Bursa"
  ) {
    user = {
      username: "muhasebe@simsektel.com",
      ad_soyad: "Muhasebe",
      rol: "MUHASEBE",
    };
  }

  if (!user) {
    return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı" });
  }

  const token = generateToken(user);

  return res.json({
    token,
    user,
  });
});

// =========================
// AVANS EKLE
// =========================
// İstersen bunu authMiddleware ile koruyabilirsin:
// app.post("/avanslar", authMiddleware, (req, res) => {
app.post("/avanslar", (req, res) => {
  const {
    talep_tarihi,
    personel_ad_soyad,
    unvan,
    gider_turu,
    tutar,
    para_birimi,
    bolge,
    proje,
    iban,
    hesap_adi,
    aciklama,
    olusturan_kullanici,
    olusturan_rol,
  } = req.body;

  let ilkDurum = "ROLLOUT_ONAY";

  if (olusturan_rol === "ROLLOUT_MANAGER") {
    ilkDurum = "ROLLOUT_ONAY";
  } else if (olusturan_rol === "BOLGE_MUDURU") {
    ilkDurum = "PROJE_MUDURU_ONAY";
  } else if (olusturan_rol === "PROJE_MUDURU") {
    ilkDurum = "DIREKTOR_ONAY";
  } else if (olusturan_rol === "PROJE_DIREKTORU") {
    ilkDurum = "MUHASEBE_ONAY";
  }

  const yeniAvans = {
    id: idCounter++,

    talep_tarihi: talep_tarihi || new Date(),
    personel_ad_soyad,
    unvan,
    gider_turu,
    tutar,
    para_birimi: para_birimi || "TRY",

    talep_durumu: ilkDurum,

    odeme_durumu: "ODEME_BEKLEMIYOR",

    onaylayan: "",
    onay_tarihi: null,
    ret_nedeni: "",
    odeme_tarihi: null,

    rollout_onay: null,
    rollout_tarih: null,
    proje_mudur_onay: null,
    proje_mudur_tarih: null,
    direktor_onay: null,
    direktor_tarih: null,

    muhasebe_onay: null,
    muhasebe_tarih: null,

    bolge,
    proje,
    iban,
    hesap_adi,
    aciklama,

    olusturan_kullanici,
    olusturan_rol,

    tarih: new Date(),
  };

  if (ilkDurum === "ONAYLANDI") {
    yeniAvans.onaylayan = olusturan_kullanici || "Sistem";
    yeniAvans.onay_tarihi = new Date();
    yeniAvans.direktor_onay = olusturan_kullanici || "Sistem";
    yeniAvans.direktor_tarih = new Date();
  }

  avanslar.unshift(yeniAvans);

  return res.json({
    message: "Avans oluşturuldu",
    data: yeniAvans,
  });
});

// =========================
// TOPLU ONAY
// =========================
app.put("/avanslar/toplu-onay", async (req, res) => {
  try {
    const { ids, user } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Seçili kayıt yok" });
    }

    const rol = user?.rol;
    const username = user?.username || "Sistem";

    const guncellenenler = [];
    const atlananlar = [];

    for (const rawId of ids) {
      const id = Number(rawId);

      const kontrol = await pool.query("SELECT * FROM avanslar WHERE id = $1", [
        id,
      ]);

      if (kontrol.rows.length === 0) {
        atlananlar.push({ id, neden: "Kayıt bulunamadı" });
        continue;
      }

      const avans = kontrol.rows[0];
      let result = null;

      if (
        avans.talep_durumu === "ROLLOUT_ONAY" &&
        (rol === "ROLLOUT_MANAGER" || rol === "BOLGE_MUDURU")
      ) {
        result = await pool.query(
          `UPDATE avanslar
           SET rollout_onay = $1,
               rollout_tarih = NOW(),
               talep_durumu = 'PROJE_MUDURU_ONAY',
               onaylayan = $1,
               onay_tarihi = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id],
        );
      } else if (
        avans.talep_durumu === "PROJE_MUDURU_ONAY" &&
        rol === "PROJE_MUDURU"
      ) {
        result = await pool.query(
          `UPDATE avanslar
           SET proje_mudur_onay = $1,
               proje_mudur_tarih = NOW(),
               talep_durumu = 'DIREKTOR_ONAY',
               onaylayan = $1,
               onay_tarihi = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id],
        );
      } else if (
        avans.talep_durumu === "DIREKTOR_ONAY" &&
        rol === "PROJE_DIREKTORU"
      ) {
        result = await pool.query(
          `UPDATE avanslar
           SET direktor_onay = $1,
               direktor_tarih = NOW(),
               talep_durumu = 'MUHASEBE_ONAY',
               onaylayan = $1,
               onay_tarihi = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id],
        );
      } else if (avans.talep_durumu === "MUHASEBE_ONAY" && rol === "MUHASEBE") {
        result = await pool.query(
          `UPDATE avanslar
           SET muhasebe_onay = $1,
               muhasebe_tarih = NOW(),
               talep_durumu = 'ONAYLANDI',
               onaylayan = $1,
               onay_tarihi = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id],
        );
      } else {
        atlananlar.push({
          id,
          neden: "Bu kayıt bu kullanıcı tarafından onaylanamaz",
        });
        continue;
      }

      guncellenenler.push(result.rows[0]);
    }

    return res.json({
      message: `${guncellenenler.length} kayıt güncellendi`,
      updatedCount: guncellenenler.length,
      skippedCount: atlananlar.length,
      data: guncellenenler,
      skipped: atlananlar,
    });
  } catch (err) {
    console.error("PUT /avanslar/toplu-onay hatası:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
});

// =========================
// TEKİL GÜNCELLEME
// =========================

app.put("/avanslar/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { durum, user } = req.body;

    const rol = user?.rol;
    const username = user?.username || "Sistem";

    const kontrol = await pool.query("SELECT * FROM avanslar WHERE id = $1", [
      id,
    ]);

    if (kontrol.rows.length === 0) {
      return res.status(404).json({ message: "Bulunamadı" });
    }

    const avans = kontrol.rows[0];

    if (durum === "ONAYLANDI") {
      if (
        avans.talep_durumu === "ROLLOUT_ONAY" &&
        (rol === "ROLLOUT_MANAGER" || rol === "BOLGE_MUDURU")
      ) {
        const result = await pool.query(
          `UPDATE avanslar
           SET rollout_onay = $1,
               rollout_tarih = NOW(),
               talep_durumu = 'PROJE_MUDURU_ONAY',
               onaylayan = $1,
               onay_tarihi = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id],
        );
        return res.json({ message: "Güncellendi", data: result.rows[0] });
      }

      if (
        avans.talep_durumu === "PROJE_MUDURU_ONAY" &&
        rol === "PROJE_MUDURU"
      ) {
        const result = await pool.query(
          `UPDATE avanslar
           SET proje_mudur_onay = $1,
               proje_mudur_tarih = NOW(),
               talep_durumu = 'DIREKTOR_ONAY',
               onaylayan = $1,
               onay_tarihi = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id],
        );
        return res.json({ message: "Güncellendi", data: result.rows[0] });
      }

      if (avans.talep_durumu === "DIREKTOR_ONAY" && rol === "PROJE_DIREKTORU") {
        const result = await pool.query(
          `UPDATE avanslar
           SET direktor_onay = $1,
               direktor_tarih = NOW(),
               talep_durumu = 'MUHASEBE_ONAY',
               onaylayan = $1,
               onay_tarihi = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id],
        );
        return res.json({ message: "Güncellendi", data: result.rows[0] });
      }

      if (avans.talep_durumu === "MUHASEBE_ONAY" && rol === "MUHASEBE") {
        const result = await pool.query(
          `UPDATE avanslar
           SET muhasebe_onay = $1,
               muhasebe_tarih = NOW(),
               talep_durumu = 'ONAYLANDI',
               onaylayan = $1,
               onay_tarihi = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id],
        );
        return res.json({ message: "Güncellendi", data: result.rows[0] });
      }

      return res.status(403).json({ message: "Yetkisiz işlem" });
    }

    if (durum === "ODENDI") {
      if (rol !== "MUHASEBE") {
        return res.status(403).json({ message: "Sadece muhasebe ödeyebilir" });
      }

      if (avans.talep_durumu !== "ONAYLANDI") {
        return res
          .status(400)
          .json({ message: "Sadece onaylanmış kayıt ödenebilir" });
      }

      const result = await pool.query(
        `UPDATE avanslar
         SET odeme_tarihi = NOW(),
             talep_durumu = 'ODENDI',
             odeme_durumu = 'ODENDI'
         WHERE id = $1
         RETURNING *`,
        [id],
      );

      return res.json({ message: "Ödeme yapıldı", data: result.rows[0] });
    }

    if (durum === "REDDEDILDI") {
      const result = await pool.query(
        `UPDATE avanslar
         SET talep_durumu = 'REDDEDILDI',
             ret_nedeni = 'Reddedildi',
             onaylayan = $1,
             onay_tarihi = NOW()
         WHERE id = $2
         RETURNING *`,
        [username, id],
      );

      return res.json({ message: "Güncellendi", data: result.rows[0] });
    }

    return res.status(400).json({ message: "Geçersiz işlem" });
  } catch (err) {
    console.error("PUT /avanslar/:id hatası:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
});

// =========================
// SİLME
// =========================
// app.delete("/avanslar/:id", authMiddleware, (req, res) => {
app.delete("/avanslar/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username } = req.query;

    const kontrol = await pool.query("SELECT * FROM avanslar WHERE id = $1", [
      id,
    ]);

    if (kontrol.rows.length === 0) {
      return res.status(404).json({ message: "Kayıt bulunamadı" });
    }

    const avans = kontrol.rows[0];

    if (
      avans.talep_durumu !== "ROLLOUT_ONAY" ||
      avans.olusturan_kullanici !== username
    ) {
      return res.status(403).json({
        message: "Bu kayıt artık silinemez",
      });
    }

    await pool.query("DELETE FROM avanslar WHERE id = $1", [id]);

    return res.json({ message: "Silindi" });
  } catch (err) {
    console.error("DELETE /avanslar/:id hatası:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
});

// =========================
// AVANS LİSTE
// =========================
// app.get("/avanslar", authMiddleware, (req, res) => {
app.get("/avanslar", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM avanslar ORDER BY id DESC");
    return res.json(result.rows);
  } catch (err) {
    console.error("GET /avanslar hatası:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
});

// =========================
// SERVER
// =========================
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("JWT_EXPIRES_IN:", process.env.JWT_EXPIRES_IN);
