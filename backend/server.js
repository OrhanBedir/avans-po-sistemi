require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

const pool = require("./db");

// =========================
// TEMEL ROUTE
// =========================
app.get("/", (req, res) => {
  res.send("API calisiyor");
});

// =========================
// DB TEST
// =========================
app.get("/fix-table", async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE avanslar
      ADD COLUMN IF NOT EXISTS olusturan_kullanici VARCHAR(255),
      ADD COLUMN IF NOT EXISTS olusturan_rol VARCHAR(100),
      ADD COLUMN IF NOT EXISTS rollout_onay VARCHAR(255),
      ADD COLUMN IF NOT EXISTS rollout_tarih TIMESTAMP,
      ADD COLUMN IF NOT EXISTS proje_mudur_onay VARCHAR(255),
      ADD COLUMN IF NOT EXISTS proje_mudur_tarih TIMESTAMP,
      ADD COLUMN IF NOT EXISTS direktor_onay VARCHAR(255),
      ADD COLUMN IF NOT EXISTS direktor_tarih TIMESTAMP,
      ADD COLUMN IF NOT EXISTS muhasebe_onay VARCHAR(255),
      ADD COLUMN IF NOT EXISTS muhasebe_tarih TIMESTAMP;
    `);

    res.send("Table fixed!");
  } catch (err) {
    console.error("FIX TABLE ERROR:", err);
    res.status(500).send(err.message);
  }
});

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

// =========================
// TABLO OLUŞTUR
// =========================
app.get("/create-table", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS avanslar (
        id SERIAL PRIMARY KEY,
        talep_tarihi TIMESTAMP DEFAULT NOW(),
        personel_ad_soyad VARCHAR(255) NOT NULL,
        unvan VARCHAR(255),
        gider_turu VARCHAR(255) NOT NULL,
        tutar NUMERIC(12,2) NOT NULL,
        para_birimi VARCHAR(10) DEFAULT 'TRY',
        bolge VARCHAR(100),
        proje VARCHAR(100),
        aciklama TEXT,
        iban VARCHAR(50),
        hesap_adi VARCHAR(255),

        talep_durumu VARCHAR(50) DEFAULT 'ROLLOUT_ONAY',
        odeme_durumu VARCHAR(50) DEFAULT 'BEKLEMEDE',

        onaylayan VARCHAR(255),
        onay_tarihi TIMESTAMP,
        red_nedeni TEXT,
        odeme_tarihi TIMESTAMP,

        rollout_onay VARCHAR(255),
        rollout_tarih TIMESTAMP,
        proje_mudur_onay VARCHAR(255),
        proje_mudur_tarih TIMESTAMP,
        direktor_onay VARCHAR(255),
        direktor_tarih TIMESTAMP,
        muhasebe_onay VARCHAR(255),
        muhasebe_tarih TIMESTAMP,

        olusturan_kullanici VARCHAR(255),
        olusturan_rol VARCHAR(100),

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    res.send("Table created!");
  } catch (err) {
    console.error("CREATE TABLE ERROR:", err);
    res.status(500).send(err.message);
  }
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
    }
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
app.post("/avanslar", async (req, res) => {
  try {
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

    if (!personel_ad_soyad || !gider_turu || !tutar) {
      return res.status(400).json({
        message: "personel_ad_soyad, gider_turu ve tutar zorunludur",
      });
    }

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

    const query = `
      INSERT INTO avanslar (
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
        talep_durumu,
        odeme_durumu
      )
      VALUES (
        COALESCE($1::timestamp, NOW()),
        $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'BEKLEMEDE'
      )
      RETURNING *;
    `;

    const values = [
      talep_tarihi || null,
      personel_ad_soyad,
      unvan || null,
      gider_turu,
      Number(tutar),
      para_birimi || "TRY",
      bolge || null,
      proje || null,
      iban || null,
      hesap_adi || null,
      aciklama || null,
      olusturan_kullanici || null,
      olusturan_rol || null,
      ilkDurum,
    ];

    const result = await pool.query(query, values);

    return res.json({
      message: "Avans oluşturuldu",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("POST /avanslar hatası:", err);
    return res.status(500).json({
      message: "Sunucu hatası",
      error: err.message,
    });
  }
});

// =========================
// API AVANS EKLE
// =========================
app.post("/api/avanslar", async (req, res) => {
  try {
    const {
      personel_ad_soyad,
      unvan,
      gider_turu,
      tutar,
      para_birimi,
      bolge,
      proje,
      aciklama,
      iban,
      hesap_adi,
      talep_tarihi,
      olusturan_kullanici,
      olusturan_rol,
    } = req.body;

    if (!personel_ad_soyad || !gider_turu || !tutar) {
      return res.status(400).json({
        message: "personel_ad_soyad, gider_turu ve tutar zorunludur",
      });
    }

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

    const query = `
      INSERT INTO avanslar (
        talep_tarihi,
        personel_ad_soyad,
        unvan,
        gider_turu,
        tutar,
        para_birimi,
        bolge,
        proje,
        aciklama,
        iban,
        hesap_adi,
        talep_durumu,
        odeme_durumu,
        olusturan_kullanici,
        olusturan_rol,
        created_at,
        updated_at
      )
      VALUES (
        COALESCE($1::timestamp, NOW()),
        $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'BEKLEMEDE', $13, $14, NOW(), NOW()
      )
      RETURNING *;
    `;

    const values = [
      talep_tarihi || null,
      personel_ad_soyad,
      unvan || null,
      gider_turu,
      Number(tutar),
      para_birimi || "TRY",
      bolge || null,
      proje || null,
      aciklama || null,
      iban || null,
      hesap_adi || null,
      ilkDurum,
      olusturan_kullanici || null,
      olusturan_rol || null,
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      message: "Avans kaydı oluşturuldu",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("AVANS INSERT ERROR:", err);
    return res.status(500).json({
      message: "Avans kaydı oluşturulamadı",
      error: err.message,
    });
  }
});




// AVANS LİSTE
// =========================


app.get("/avanslar", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM avanslar ORDER BY id DESC");
    return res.json(result.rows);
  } catch (err) {
    console.error("GET /avanslar hatası:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
});

app.get("/api/avanslar", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM avanslar
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("AVANS LIST ERROR:", err);
    res.status(500).json({
      message: "Avans listesi alınamadı",
      error: err.message,
    });
  }
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
               onay_tarihi = NOW(),
               updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id]
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
               onay_tarihi = NOW(),
               updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id]
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
               onay_tarihi = NOW(),
               updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id]
        );
      } else if (avans.talep_durumu === "MUHASEBE_ONAY" && rol === "MUHASEBE") {
        result = await pool.query(
          `UPDATE avanslar
           SET muhasebe_onay = $1,
               muhasebe_tarih = NOW(),
               talep_durumu = 'ONAYLANDI',
               onaylayan = $1,
               onay_tarihi = NOW(),
               updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id]
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
               onay_tarihi = NOW(),
               updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id]
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
               onay_tarihi = NOW(),
               updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id]
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
               onay_tarihi = NOW(),
               updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id]
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
               onay_tarihi = NOW(),
               updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [username, id]
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
             odeme_durumu = 'ODENDI',
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      return res.json({ message: "Ödeme yapıldı", data: result.rows[0] });
    }

    if (durum === "REDDEDILDI") {
      const result = await pool.query(
        `UPDATE avanslar
         SET talep_durumu = 'REDDEDILDI',
             red_nedeni = 'Reddedildi',
             onaylayan = $1,
             onay_tarihi = NOW(),
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [username, id]
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
// MAIL TESTER / PLACEHOLDER
// =========================
app.get("/mail-test", async (req, res) => {
  try {
    return res.json({ message: "Mail servisi hazir" });
  } catch (err) {
    return res.status(500).json({ message: "Mail test hatasi" });
  }
});

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 3000;

console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("JWT_EXPIRES_IN:", process.env.JWT_EXPIRES_IN);

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});