import { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const API = "https://avans-po-sistemi-production.up.railway.app";

const PERSONELLER = [
  {
    ad: "Ender Teke",
    unvan: "Ekip Şefi",
    iban: "TR620006200048600006655255",
    hesap: "Ender Teke",
  },
  {
    ad: "Handan Mantı",
    unvan: "İSG Müdürü",
    iban: "TR900006200117000006645899",
    hesap: "Handan Mantı",
  },
  {
    ad: "Murat İstek",
    unvan: "Depo Envanter Müdürü",
    iban: "TR200006200117000006645898",
    hesap: "Murat İstek",
  },
  {
    ad: "Soner Turan",
    unvan: "Ekip Şefi",
    iban: "TR310006200117000006645894",
    hesap: "Soner Turan",
  },
  {
    ad: "Selçuk Fırat",
    unvan: "Ekip Elemanı",
    iban: "TR850006200117000006645892",
    hesap: "Selçuk Fırat",
  },
  {
    ad: "HATİCE OMUŞ",
    unvan: "IFIS/BTK Sorumlusu",
    iban: "TR420006200117000006644726",
    hesap: "HATİCE OMUŞ",
  },
  {
    ad: "Orhan Bedir",
    unvan: "Proje Müdürü",
    iban: "TR780006200119300006646970",
    hesap: "Orhan Bedir",
  },
  {
    ad: "Serdar Altınova",
    unvan: "Bölge Müdürü",
    iban: "TR570006200106600006681448",
    hesap: "Serdar Altınova",
  },
  {
    ad: "Kasım Evin",
    unvan: "Süpervizör",
    iban: "TR9600062000092000006650211",
    hesap: "Kasım Evin",
  },
  {
    ad: "İbrahim Mestan",
    unvan: "Ekip Şefi",
    iban: "TR840011100000000075420473",
    hesap: "İbrahim Mestan",
  },
  {
    ad: "İsmail Tayan",
    unvan: "Ekip Elemanı",
    iban: "TR240015700000000154063525",
    hesap: "İsmail Tayan",
  },
  {
    ad: "Adem Karhan",
    unvan: "Ekip Elemanı",
    iban: "TR3200067001000000031454973",
    hesap: "Adem Karhan",
  },
  {
    ad: "Ömer Özkan",
    unvan: "Ekip Elemanı",
    iban: "TR030006200159000006607244",
    hesap: "Ömer Özkan",
  },
  {
    ad: "Murat Yokuş",
    unvan: "Ekip Şefi",
    iban: "TR340001500158007313416956",
    hesap: "Murat Yokuş",
  },
  {
    ad: "Nurcan Kuş",
    unvan: "Rollout Müdürü",
    iban: "TR370006200052600006884328",
    hesap: "Nurcan Kuş",
  },
  {
    ad: "Murat Nabitoğlu",
    unvan: "Bölge Müdürü",
    iban: "TR7300067001000000070275672",
    hesap: "Murat Nabitoğlu",
  },
  {
    ad: "Cem Sebir",
    unvan: "Ekip Elemanı",
    iban: "TR30000100901026661850001",
    hesap: "Cem Sebir",
  },
  {
    ad: "Eyüp Sebir",
    unvan: "Ekip Elemanı",
    iban: "TR480001001034673275965001",
    hesap: "Eyüp Sebir",
  },
  {
    ad: "Mehmet Çakır",
    unvan: "Ekip Elemanı",
    iban: "TR670001002062542321715002",
    hesap: "Mehmet Çakır",
  },
  {
    ad: "Yıldıray Turhan",
    unvan: "Ekip Elemanı",
    iban: "TR590011100000000162021068",
    hesap: "Yıldıray Turhan",
  },
];

const GIDER_TIPLERI = [
  "Yol",
  "Konaklama",
  "Akşam Yemeği",
  "Yakıt",
  "Malzeme",
  "İş Avansı",
  "Maaş Avansı",
  "Diğer",
];

const formatDateInputToday = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getItemOdemeDurumu = (item) => item.odeme_durumu || "";

const formatDateTR = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("tr-TR");
};

const getDurumBadgeStyle = (durum) => {
  if (
    durum === "ROLLOUT_ONAY" ||
    durum === "PROJE_MUDURU_ONAY" ||
    durum === "DIREKTOR_ONAY" ||
    durum === "MUHASEBE_ONAY" ||
    durum === "BEKLIYOR"
  ) {
    return {
      background: "#FEF3C7",
      color: "#92400E",
      border: "1px solid #FCD34D",
    };
  }

  if (durum === "ONAYLANDI") {
    return {
      background: "#DCFCE7",
      color: "#166534",
      border: "1px solid #86EFAC",
    };
  }

  if (durum === "REDDEDILDI") {
    return {
      background: "#FEE2E2",
      color: "#991B1B",
      border: "1px solid #FCA5A5",
    };
  }

  if (durum === "ODENDI") {
    return {
      background: "#DBEAFE",
      color: "#1D4ED8",
      border: "1px solid #93C5FD",
    };
  }

  return {
    background: "#F3F4F6",
    color: "#374151",
    border: "1px solid #D1D5DB",
  };
};

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const [hata, setHata] = useState("");

  const [personel, setPersonel] = useState("");
  const [personelSecim, setPersonelSecim] = useState("");
  const [tutar, setTutar] = useState("");
  const [giderTipi, setGiderTipi] = useState("");
  const [liste, setListe] = useState([]);
  const [mesaj, setMesaj] = useState("");

  const [showTumTalepler, setShowTumTalepler] = useState(false);
  const [filtrePersonel, setFiltrePersonel] = useState("");
  const [filtreBaslangic, setFiltreBaslangic] = useState("");
  const [filtreBitis, setFiltreBitis] = useState("");

  const [unvan, setUnvan] = useState("");
  const [iban, setIban] = useState("");
  const [hesapAdi, setHesapAdi] = useState("");
  const [talepTarihi, setTalepTarihi] = useState("");
  const [bolge, setBolge] = useState("");
  const [proje, setProje] = useState("");
  const [aciklama, setAciklama] = useState("");

  const [hoveredId, setHoveredId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const rol = user?.rol ?? "";

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  const talepAcabilir = rol !== "MUHASEBE";

  const tumListeyiGorebilir = true;

  const finansalDetayGorebilir =
    rol === "MUHASEBE" || rol === "PROJE_DIREKTORU";

  const manuelGiris = personelSecim === "MANUEL";

  const getItemPersonel = (item) =>
    item.personel_ad_soyad || item.personel || "";

  const getItemGider = (item) => item.gider_turu || item.gider_tipi || "";

  const getItemDurum = (item) => item.talep_durumu || item.durum || "";

  const getItemTarih = (item) => item.talep_tarihi || item.tarih || null;

  const getItemOnaylayan = (item) => item.onaylayan || "";
  const getItemOnayTarihi = (item) => item.onay_tarihi || "";
  const getItemRedNedeni = (item) => item.red_nedeni || item.ret_nedeni || "";
  const getItemOdemeTarihi = (item) => item.odeme_tarihi || "";
  const getItemUnvan = (item) => item.unvan || "";
  const getItemIban = (item) => item.iban || "";
  const getItemHesapAdi = (item) => item.hesap_adi || "";
  const getItemBolge = (item) => item.bolge || "";
  const getItemProje = (item) => item.proje || "";
  const getItemParaBirimi = (item) => item.para_birimi || "TRY";
  const getItemAciklama = (item) => item.aciklama || "";

  const ilgiliKaydiSilebilir = (item) => {
    return (
      (rol === "PROJE_MUDURU" || rol === "PROJE_DIREKTORU") &&
      item.olusturan_kullanici === user?.username &&
      getItemDurum(item) === "ROLLOUT_ONAY"
    );
  };

  const ilgiliAsamadaOnaylayabilir = (item) => {
    const durum = getItemDurum(item);

    if (
      durum === "ROLLOUT_ONAY" &&
      (rol === "ROLLOUT_MANAGER" || rol === "BOLGE_MUDURU")
    ) {
      return true;
    }

    if (durum === "PROJE_MUDURU_ONAY" && rol === "PROJE_MUDURU") {
      return true;
    }

    if (durum === "DIREKTOR_ONAY" && rol === "PROJE_DIREKTORU") {
      return true;
    }

    if (durum === "MUHASEBE_ONAY" && rol === "MUHASEBE") {
      return true;
    }

    return false;
  };

  const getDurumText = (item) => {
    const durum = getItemDurum(item);
    getItemOdemeDurumu(item);

    if (durum === "ROLLOUT_ONAY") {
      return "Rollout / Bölge Müdürü Onayı Bekliyor";
    }
    if (durum === "PROJE_MUDURU_ONAY") {
      return "Proje Müdürü Onayı Bekliyor";
    }
    if (durum === "DIREKTOR_ONAY") {
      return "Proje Direktörü Onayı Bekliyor";
    }
    if (durum === "MUHASEBE_ONAY") {
      return "Muhasebe Onayı Bekliyor";
    }
    if (durum === "ONAYLANDI") return "Onaylandı";
    if (durum === "ODENDI") return "Ödendi";
    if (durum === "REDDEDILDI") return "Reddedildi";
    if (durum === "BEKLIYOR") return "Bekliyor";

    return durum || "-";
  };

  const handlePersonelChange = (value) => {
    setPersonelSecim(value);
    setMesaj("");

    if (value === "MANUEL") {
      setPersonel("");
      setUnvan("");
      setIban("");
      setHesapAdi("");
      if (!talepTarihi) setTalepTarihi(formatDateInputToday());
      return;
    }

    if (!value) {
      setPersonel("");
      setUnvan("");
      setIban("");
      setHesapAdi("");
      return;
    }

    const kisi = PERSONELLER.find((p) => p.ad === value);

    if (kisi) {
      setPersonel(kisi.ad);
      setUnvan(kisi.unvan);
      setIban(kisi.iban);
      setHesapAdi(kisi.hesap);
      setTalepTarihi(formatDateInputToday());
    }
  };

  const temizleForm = () => {
    setPersonel("");
    setPersonelSecim("");
    setTutar("");
    setGiderTipi("");
    setUnvan("");
    setIban("");
    setHesapAdi("");
    setTalepTarihi("");
    setBolge("");
    setProje("");
    setAciklama("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setHata("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setHata(data.message || "Giriş başarısız");
        return;
      }

      setToken(data.token);
      setUser(data.user);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (err) {
      console.error(err);
      setHata("Server bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  const avanslariGetir = async () => {
    try {
      const res = await fetch(`${API}/api/avanslar`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.message || "Liste alınamadı");
        return;
      }

      setListe(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && token) {
      avanslariGetir();
    }
  }, [user, token]);

  const handleAvansEkle = async (e) => {
    e.preventDefault();
    setMesaj("");

    if (!personel || !tutar || !giderTipi) {
      setMesaj("Lütfen zorunlu alanları doldur.");
      return;
    }

    if (!manuelGiris && !talepTarihi) {
      setMesaj("Talep tarihi boş olamaz.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/avanslar`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          talep_tarihi: talepTarihi
            ? new Date(`${talepTarihi}T12:00:00`)
            : new Date(),
          personel_ad_soyad: personel,
          unvan,
          gider_turu: giderTipi,
          tutar: Number(tutar),
          para_birimi: "TRY",
          bolge,
          proje,
          iban,
          hesap_adi: hesapAdi,
          aciklama,
          olusturan_kullanici: user?.username || "",
          olusturan_rol: user?.rol || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMesaj(
          data.error
            ? `${data.message} - ${data.error}`
            : data.message || "Kayıt sırasında hata oluştu.",
        );
        return;
      }

      setMesaj(data.message || "Avans oluşturuldu");
      temizleForm();
      avanslariGetir();
    } catch (err) {
      console.error(err);
      setMesaj("Server bağlantı hatası");
    }
  };

  const guncelle = async (id, durum) => {
    try {
      const res = await fetch(`${API}/avanslar/${id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          durum,
          user: {
            username: user?.username || "Sistem",
            rol: user?.rol || "",
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Güncelleme hatası");
        return;
      }

      setMesaj(data.message || "Güncellendi");
      avanslariGetir();
    } catch (err) {
      console.error(err);
      alert("Server bağlantı hatası");
    }
  };

  const handleSil = async (id) => {
    const onay = window.confirm("Bu talebi silmek istediğine emin misin?");
    if (!onay) return;

    try {
      const res = await fetch(
        `${API}/avanslar/${id}?username=${encodeURIComponent(user.username)}&rol=${encodeURIComponent(user.rol)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Silme hatası");
        return;
      }

      setMesaj(data.message || "Kayıt silindi");
      avanslariGetir();
    } catch (err) {
      console.error(err);
      alert("Server bağlantı hatası");
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const seciliMi = (id) => selectedIds.includes(id);

  const tumunuSecVeyaKaldir = () => {
    const uygunIdler = filtrelenmisTumListe
      .filter((item) => ilgiliAsamadaOnaylayabilir(item))
      .map((item) => item.id);

    const hepsiSecili =
      uygunIdler.length > 0 &&
      uygunIdler.every((id) => selectedIds.includes(id));

    if (hepsiSecili) {
      setSelectedIds((prev) => prev.filter((id) => !uygunIdler.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...uygunIdler])]);
    }
  };

  const secilenleriTopluOnayla = async () => {
    if (!selectedIds.length) {
      alert("Lütfen en az bir kayıt seç.");
      return;
    }

    try {
      const res = await fetch(`${API}/avanslar/toplu-onay`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          ids: selectedIds,
          user: {
            username: user?.username || "Sistem",
            rol: user?.rol || "",
          },
          mailGonder: false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Toplu onay hatası");
        return;
      }

      setMesaj(data.message || "Seçilen kayıtlar güncellendi");
      setSelectedIds([]);
      avanslariGetir();
    } catch (err) {
      console.error(err);
      alert("Server bağlantı hatası");
    }
  };

  const gorunenListe = useMemo(() => {
    return liste.filter((item) => {
      const durum = getItemDurum(item);

      if (durum === "ODENDI") return false;
      if (durum === "REDDEDILDI") return false;

      if (rol === "MUHASEBE") {
        return durum === "MUHASEBE_ONAY" || durum === "ONAYLANDI";
      }

      if (rol === "ROLLOUT_MANAGER") {
        return durum === "ROLLOUT_ONAY";
      }

      if (rol === "BOLGE_MUDURU") {
        return durum === "ROLLOUT_ONAY";
      }

      if (rol === "PROJE_MUDURU") {
        return durum === "PROJE_MUDURU_ONAY";
      }

      if (rol === "PROJE_DIREKTORU") {
        return durum === "DIREKTOR_ONAY";
      }

      return true;
    });
  }, [liste, rol]);

  const benzersizPersoneller = useMemo(() => {
    return [
      ...new Set(liste.map((item) => getItemPersonel(item)).filter(Boolean)),
    ];
  }, [liste]);

  const filtrelenmisTumListe = useMemo(() => {
    return liste.filter((item) => {
      const itemTarihRaw = getItemTarih(item);
      const itemTarih = itemTarihRaw ? new Date(itemTarihRaw) : null;

      const personelUygun = filtrePersonel
        ? getItemPersonel(item) === filtrePersonel
        : true;

      const baslangicUygun =
        filtreBaslangic && itemTarih
          ? itemTarih >= new Date(`${filtreBaslangic}T00:00:00`)
          : !filtreBaslangic;

      const bitisUygun =
        filtreBitis && itemTarih
          ? itemTarih <= new Date(`${filtreBitis}T23:59:59`)
          : !filtreBitis;

      return personelUygun && baslangicUygun && bitisUygun;
    });
  }, [liste, filtrePersonel, filtreBaslangic, filtreBitis]);

  const filtreToplamTutar = filtrelenmisTumListe.reduce(
    (toplam, item) => toplam + Number(item.tutar || 0),
    0,
  );

  const excelIndir = async () => {
    if (!filtrelenmisTumListe.length) {
      alert("İndirilecek veri yok");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Avanslar", {
      views: [{ state: "frozen", ySplit: 9, showGridLines: false }],
    });

    const seciliPersonel = filtrePersonel || "Tüm Personeller";
    const seciliBaslangic = filtreBaslangic || "-";
    const seciliBitis = filtreBitis || "-";

    const ortakKolonlar = [
      { header: "Kayıt No", key: "id", width: 10 },
      { header: "Talep Tarihi", key: "talep_tarihi", width: 20 },
      { header: "Personel Ad Soyad", key: "personel_ad_soyad", width: 24 },
      { header: "Ünvan", key: "unvan", width: 20 },
      { header: "Gider Türü", key: "gider_turu", width: 20 },
      { header: "Tutar", key: "tutar", width: 14 },
      { header: "Para Birimi", key: "para_birimi", width: 14 },
      { header: "Durum", key: "talep_durumu", width: 18 },
      { header: "Onaylayan", key: "onaylayan", width: 18 },
      { header: "Onay Tarihi", key: "onay_tarihi", width: 20 },
      { header: "Red Nedeni", key: "red_nedeni", width: 22 },
      { header: "Ödeme Tarihi", key: "odeme_tarihi", width: 20 },
      { header: "Bölge", key: "bolge", width: 18 },
      { header: "Proje", key: "proje", width: 18 },
    ];

    const finansKolonlari = finansalDetayGorebilir
      ? [
          { header: "IBAN", key: "iban", width: 30 },
          { header: "Hesap Adı", key: "hesap_adi", width: 24 },
          { header: "Not", key: "aciklama", width: 28 },
        ]
      : [];

    worksheet.columns = [...ortakKolonlar, ...finansKolonlari];

    const sonKolonHarf = worksheet.getRow(1).worksheet.columns.length;
    const kolonHarfi = (n) => {
      let s = "";
      while (n > 0) {
        const m = (n - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        n = Math.floor((n - 1) / 26);
      }
      return s;
    };
    const lastCol = kolonHarfi(sonKolonHarf);

    worksheet.mergeCells(`A1:${lastCol}1`);
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "AVANS TALEP RAPORU";
    titleCell.font = {
      size: 18,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1F4E78" },
    };
    titleCell.border = {
      top: { style: "thin", color: { argb: "1F1F1F" } },
      left: { style: "thin", color: { argb: "1F1F1F" } },
      bottom: { style: "thin", color: { argb: "1F1F1F" } },
      right: { style: "thin", color: { argb: "1F1F1F" } },
    };
    worksheet.getRow(1).height = 32;

    const infoRows = [
      ["Personel Filtresi", seciliPersonel],
      ["Başlangıç Tarihi", seciliBaslangic],
      ["Bitiş Tarihi", seciliBitis],
      ["Kayıt Sayısı", filtrelenmisTumListe.length],
      ["Toplam Tutar", filtreToplamTutar],
    ];

    let infoStartRow = 3;
    infoRows.forEach((row, index) => {
      const r = worksheet.getRow(infoStartRow + index);

      r.getCell(1).value = row[0];
      r.getCell(2).value = row[1];

      r.getCell(1).font = { bold: true, color: { argb: "1F1F1F" } };
      r.getCell(2).font = { color: { argb: "1F1F1F" } };

      r.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D9E2F3" },
      };
      r.getCell(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F3F6FA" },
      };

      r.getCell(1).border = {
        top: { style: "thin", color: { argb: "BFBFBF" } },
        left: { style: "thin", color: { argb: "BFBFBF" } },
        bottom: { style: "thin", color: { argb: "BFBFBF" } },
        right: { style: "thin", color: { argb: "BFBFBF" } },
      };
      r.getCell(2).border = {
        top: { style: "thin", color: { argb: "BFBFBF" } },
        left: { style: "thin", color: { argb: "BFBFBF" } },
        bottom: { style: "thin", color: { argb: "BFBFBF" } },
        right: { style: "thin", color: { argb: "BFBFBF" } },
      };

      if (row[0] === "Toplam Tutar") {
        r.getCell(2).numFmt = '#,##0 "TL"';
        r.getCell(2).font = { bold: true, color: { argb: "0B6E4F" } };
      }
    });

    const headerRowNumber = 9;
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = worksheet.columns.map((col) => col.header);
    headerRow.height = 24;

    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        size: 12,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "44546A" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "D9D9D9" } },
        left: { style: "thin", color: { argb: "D9D9D9" } },
        bottom: { style: "thin", color: { argb: "D9D9D9" } },
        right: { style: "thin", color: { argb: "D9D9D9" } },
      };
    });

    filtrelenmisTumListe.forEach((item, index) => {
      const rowNumber = headerRowNumber + 1 + index;
      const row = worksheet.getRow(rowNumber);

      const rowData = {
        id: item.id,
        talep_tarihi: getItemTarih(item)
          ? new Date(getItemTarih(item)).toLocaleString("tr-TR")
          : "",
        personel_ad_soyad: getItemPersonel(item),
        unvan: getItemUnvan(item),
        gider_turu: getItemGider(item),
        tutar: Number(item.tutar || 0),
        para_birimi: getItemParaBirimi(item),
        talep_durumu: getItemDurum(item),
        onaylayan: getItemOnaylayan(item),
        onay_tarihi: getItemOnayTarihi(item)
          ? new Date(getItemOnayTarihi(item)).toLocaleString("tr-TR")
          : "",
        red_nedeni: getItemRedNedeni(item),
        odeme_tarihi: getItemOdemeTarihi(item)
          ? new Date(getItemOdemeTarihi(item)).toLocaleString("tr-TR")
          : "",
        bolge: getItemBolge(item),
        proje: getItemProje(item),
        iban: getItemIban(item),
        hesap_adi: getItemHesapAdi(item),
        aciklama: getItemAciklama(item),
      };

      worksheet.columns.forEach((col, colIndex) => {
        row.getCell(colIndex + 1).value = rowData[col.key];
      });

      row.eachCell((cell) => {
        cell.alignment = {
          vertical: "middle",
          horizontal: typeof cell.value === "number" ? "right" : "left",
        };
        cell.border = {
          top: { style: "thin", color: { argb: "E5E7EB" } },
          left: { style: "thin", color: { argb: "E5E7EB" } },
          bottom: { style: "thin", color: { argb: "E5E7EB" } },
          right: { style: "thin", color: { argb: "E5E7EB" } },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rowNumber % 2 === 0 ? "F8FAFC" : "FFFFFF" },
        };
      });

      const durumColIndex = worksheet.columns.findIndex(
        (c) => c.key === "talep_durumu",
      );

      if (durumColIndex >= 0) {
        const durumCell = row.getCell(durumColIndex + 1);
        const durum = getItemDurum(item);

        if (durum === "ONAYLANDI") {
          durumCell.font = { bold: true, color: { argb: "166534" } };
        } else if (durum === "REDDEDILDI") {
          durumCell.font = { bold: true, color: { argb: "991B1B" } };
        } else {
          durumCell.font = { bold: true, color: { argb: "B45309" } };
        }
      }
    });

    worksheet.autoFilter = {
      from: { row: headerRowNumber, column: 1 },
      to: { row: headerRowNumber, column: worksheet.columns.length },
    };

    worksheet.pageSetup = {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const tarihDamga = new Date().toISOString().slice(0, 10);
    saveAs(blob, `avans_raporu_${tarihDamga}.xlsx`);
  };

  const handleLogout = () => {
    setUser(null);
    setToken("");
    setUsername("");
    setPassword("");
    setHata("");
    temizleForm();
    setListe([]);
    setMesaj("");
    setShowTumTalepler(false);
    setFiltrePersonel("");
    setFiltreBaslangic("");
    setFiltreBitis("");
    setSelectedIds([]);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.loginCard}>
          <h1 style={styles.loginTitle}>Avans Sistemi</h1>
          <p style={styles.loginSubtitle}>Hesabınla giriş yap</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <input
              style={styles.input}
              placeholder="Kullanıcı adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              style={styles.input}
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş"}
            </button>
          </form>

          {hata ? <div style={styles.errorBox}>{hata}</div> : null}

          <div style={{ textAlign: "center", marginTop: 10, color: "#6b7280" }}>
            Yetkiniz yoksa sistem yöneticisi ile iletişime geçiniz.
          </div>
        </div>
      </div>
    );
  }

  if (showTumTalepler) {
    return (
      <div style={styles.page}>
        <div
          style={{
            ...styles.topBar,
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
          }}
        >
          <div>
            <h1 style={styles.pageTitle}>Tüm Talepler</h1>
            <div style={styles.userInfo}>
              Hoşgeldin <b>{user.username}</b> — Rol: <b>{user.rol}</b>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexDirection: isMobile ? "column" : "row",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <button
              type="button"
              style={{ ...styles.button, width: 160, background: "#2563eb" }}
              onClick={excelIndir}
            >
              Excel İndir
            </button>

            <button
              type="button"
              style={{ ...styles.button, width: 160, background: "#6b7280" }}
              onClick={() => setShowTumTalepler(false)}
            >
              Geri Dön
            </button>
          </div>
        </div>

        <div style={styles.cardLarge}>
          <h2 style={styles.sectionTitle}>Filtreler</h2>

          <div
            style={{
              ...styles.filterGrid,
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
            }}
          >
            <select
              style={styles.input}
              value={filtrePersonel}
              onChange={(e) => setFiltrePersonel(e.target.value)}
            >
              <option value="">Tüm Personeller</option>
              {benzersizPersoneller.map((ad) => (
                <option key={ad} value={ad}>
                  {ad}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              type="date"
              value={filtreBaslangic}
              onChange={(e) => setFiltreBaslangic(e.target.value)}
            />

            <input
              style={styles.input}
              type="date"
              value={filtreBitis}
              onChange={(e) => setFiltreBitis(e.target.value)}
            />
          </div>

          <div
            style={{
              ...styles.summaryBox,
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 10 : 24,
            }}
          >
            <div>
              <b>Kayıt Sayısı:</b> {filtrelenmisTumListe.length}
            </div>
            <div>
              <b>Toplam Tutar:</b> {filtreToplamTutar} TL
            </div>
          </div>
        </div>

        <div style={{ height: 20 }} />

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            style={{
              ...styles.button,
              width: 220,
              background: "#0f766e",
              marginTop: 0,
            }}
            onClick={secilenleriTopluOnayla}
          >
            Seçilileri Onaya Gönder
          </button>

          <button
            type="button"
            style={{
              ...styles.button,
              width: 180,
              background: "#374151",
              marginTop: 0,
            }}
            onClick={tumunuSecVeyaKaldir}
          >
            Tümünü Se / Kaldır
          </button>
        </div>

        <div style={styles.cardLarge}>
          <h2 style={styles.sectionTitle}>Talepler</h2>

          {filtrelenmisTumListe.length === 0 ? (
            <div style={styles.emptyText}>Filtreye uygun kayıt yok.</div>
          ) : isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtrelenmisTumListe.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "14px",
                    padding: "14px",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <b>#{item.id}</b>
                    {ilgiliAsamadaOnaylayabilir(item) && (
                      <input
                        type="checkbox"
                        checked={seciliMi(item.id)}
                        onChange={() => toggleSelected(item.id)}
                      />
                    )}
                  </div>

                  <div style={styles.listRow}>
                    <span style={styles.label}>Personel:</span>
                    <span>{item.personel_ad_soyad}</span>
                  </div>

                  <div style={styles.listRow}>
                    <span style={styles.label}>Tutar:</span>
                    <span>
                      {item.tutar} {item.para_birimi}
                    </span>
                  </div>

                  <div style={styles.listRow}>
                    <span style={styles.label}>Bölge:</span>
                    <span>{item.bolge || "-"}</span>
                  </div>

                  <div style={styles.listRow}>
                    <span style={styles.label}>Gider Türü:</span>
                    <span>{getItemGider(item) || "-"}</span>
                  </div>

                  <div style={styles.listRow}>
                    <span style={styles.label}>Tarih:</span>
                    <span>{formatDateTR(getItemTarih(item))}</span>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getDurumBadgeStyle(item.talep_durumu),
                      }}
                    >
                      {getDurumText(item)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  background: "#fff",
                  zIndex: 1,
                }}
              >
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ width: 40, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      onChange={tumunuSecVeyaKaldir}
                      checked={
                        filtrelenmisTumListe.filter((item) =>
                          ilgiliAsamadaOnaylayabilir(item),
                        ).length > 0 &&
                        filtrelenmisTumListe
                          .filter((item) => ilgiliAsamadaOnaylayabilir(item))
                          .every((item) => seciliMi(item.id))
                      }
                    />
                  </th>
                  <th>Kayıt No</th>
                  <th>Personel</th>
                  <th>Tutar</th>
                  <th>Bölge</th>
                  <th>Gider Türü</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                </tr>
              </thead>

              <tbody>
                {filtrelenmisTumListe.map((item) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: "center", padding: "10px" }}>
                      {ilgiliAsamadaOnaylayabilir(item) && (
                        <input
                          type="checkbox"
                          checked={seciliMi(item.id)}
                          onChange={() => toggleSelected(item.id)}
                        />
                      )}
                    </td>

                    <td>{item.id}</td>
                    <td>{item.personel_ad_soyad}</td>
                    <td>
                      {item.tutar} {item.para_birimi}
                    </td>
                    <td>{item.bolge || "-"}</td>
                    <td>{getItemGider(item) || "-"}</td>
                    <td>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...getDurumBadgeStyle(item.talep_durumu),
                        }}
                      >
                        {getDurumText(item)}
                      </span>
                    </td>
                    <td>{formatDateTR(getItemTarih(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.topBar,
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
        }}
      >
        <div>
          <h1 style={styles.pageTitle}>Avans Sistemi</h1>
          <div style={styles.userInfo}>
            Hoşgeldin <b>{user.username}</b> — Rol: <b>{user.rol}</b>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexDirection: isMobile ? "column" : "row",
            width: isMobile ? "100%" : "auto",
          }}
        >
          {tumListeyiGorebilir && (
            <button
              type="button"
              style={{ ...styles.button, width: 180, background: "#0f766e" }}
              onClick={() => setShowTumTalepler(true)}
            >
              Tüm Talepleri Gör
            </button>
          )}

          <button
            type="button"
            style={{ ...styles.button, width: 140, background: "#6b7280" }}
            onClick={handleLogout}
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      <div
        style={{
          ...styles.mainGrid,
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1.4fr",
        }}
      >
        {talepAcabilir && (
          <div style={styles.cardLarge}>
            <h2 style={styles.sectionTitle}>Avans Ekle</h2>

            <form onSubmit={handleAvansEkle} style={styles.form}>
              <select
                style={styles.input}
                value={personelSecim}
                onChange={(e) => handlePersonelChange(e.target.value)}
              >
                <option value="">Personel Seç</option>
                {PERSONELLER.map((p) => (
                  <option key={p.ad} value={p.ad}>
                    {p.ad}
                  </option>
                ))}
                <option value="MANUEL">Listede yok (manuel)</option>
              </select>

              {manuelGiris && (
                <>
                  <input
                    style={styles.input}
                    placeholder="Ad Soyad"
                    value={personel}
                    onChange={(e) => setPersonel(e.target.value)}
                  />
                  <input
                    style={styles.input}
                    placeholder="Ünvan"
                    value={unvan}
                    onChange={(e) => setUnvan(e.target.value)}
                  />
                  <input
                    style={styles.input}
                    placeholder="IBAN"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                  />
                  <input
                    style={styles.input}
                    placeholder="Hesap Adı"
                    value={hesapAdi}
                    onChange={(e) => setHesapAdi(e.target.value)}
                  />
                </>
              )}

              {!manuelGiris && personel && (
                <>
                  <input
                    style={styles.readonlyInput}
                    value={`Ünvan: ${unvan || "-"}`}
                    readOnly
                  />
                  <input
                    style={styles.readonlyInput}
                    value={`IBAN: ${iban || "-"}`}
                    readOnly
                  />
                  <input
                    style={styles.readonlyInput}
                    value={`Hesap Adı: ${hesapAdi || "-"}`}
                    readOnly
                  />
                </>
              )}

              <input
                style={styles.input}
                type="date"
                value={talepTarihi}
                onChange={(e) => setTalepTarihi(e.target.value)}
              />

              <select
                style={styles.input}
                value={giderTipi}
                onChange={(e) => setGiderTipi(e.target.value)}
              >
                <option value="">Gider Türü Seç</option>
                {GIDER_TIPLERI.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              <input
                style={styles.input}
                type="number"
                placeholder="Tutar"
                value={tutar}
                onChange={(e) => setTutar(e.target.value)}
              />

              <input
                style={styles.readonlyInput}
                value="Para Birimi: TRY"
                readOnly
              />

              <input
                style={styles.input}
                placeholder="Bölge"
                value={bolge}
                onChange={(e) => setBolge(e.target.value)}
              />

              <input
                style={styles.input}
                placeholder="Proje"
                value={proje}
                onChange={(e) => setProje(e.target.value)}
              />

              <textarea
                style={styles.textarea}
                placeholder="Not"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
              />

              <button type="submit" style={styles.button}>
                Kaydet
              </button>
            </form>

            {mesaj ? <div style={styles.successBox}>{mesaj}</div> : null}
          </div>
        )}

        <div style={styles.cardLarge}>
          <h2 style={styles.sectionTitle}>Avans Listesi</h2>

          {gorunenListe.length === 0 ? (
            <div style={styles.emptyText}>Henüz kayıt yok.</div>
          ) : (
            <div style={styles.listWrap}>
              {gorunenListe.map((item) => {
                const durum = getItemDurum(item);

                return (
                  <div
                    key={item.id}
                    style={{
                      ...styles.listItem,
                      ...(hoveredId === item.id ? styles.listItemHover : {}),
                    }}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div style={styles.listItemHeader}>
                      <div style={styles.listItemTitle}>
                        #{item.id} - {getItemPersonel(item)}
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          ...getDurumBadgeStyle(item.talep_durumu),
                        }}
                      >
                        {getDurumText(item)}
                      </span>
                    </div>

                    <div style={styles.listRow}>
                      <span style={styles.label}>Personel:</span>
                      <span>{getItemPersonel(item)}</span>
                    </div>

                    <div style={styles.listRow}>
                      <span style={styles.label}>Ünvan:</span>
                      <span>{getItemUnvan(item) || "-"}</span>
                    </div>

                    <div style={styles.listRow}>
                      <span style={styles.label}>Gider Türü:</span>
                      <span>{getItemGider(item)}</span>
                    </div>

                    <div style={styles.listRow}>
                      <span style={styles.label}>Tutar:</span>
                      <span>
                        {item.tutar} {getItemParaBirimi(item)}
                      </span>
                    </div>

                    <div style={styles.listRow}>
                      <span style={styles.label}>Talep Tarihi:</span>
                      <span>{formatDateTR(getItemTarih(item))}</span>
                    </div>

                    <div style={styles.listRow}>
                      <span style={styles.label}>Bölge:</span>
                      <span>{getItemBolge(item) || "-"}</span>
                    </div>

                    <div style={styles.listRow}>
                      <span style={styles.label}>Proje:</span>
                      <span>{getItemProje(item) || "-"}</span>
                    </div>

                    <div style={styles.listRow}>
                      <span style={styles.label}>Durum:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            getItemDurum(item) === "ONAYLANDI"
                              ? "#166534"
                              : getItemDurum(item) === "REDDEDILDI"
                                ? "#991b1b"
                                : "#b45309",
                        }}
                      >
                        {getDurumText(item)}
                      </span>
                    </div>

                    <div style={styles.listRow}>
                      <span style={styles.label}>Onaylayan:</span>
                      <span>{getItemOnaylayan(item) || "-"}</span>
                    </div>

                    <div style={styles.listRow}>
                      <span style={styles.label}>Onay Tarihi:</span>
                      <span>
                        {getItemOnayTarihi(item)
                          ? new Date(
                              getItemOnayTarihi(item),
                            ).toLocaleDateString("tr-TR")
                          : "-"}
                      </span>
                    </div>

                    <div style={styles.listRow}>
                      <span style={styles.label}>Red Nedeni:</span>
                      <span>{getItemRedNedeni(item) || "-"}</span>
                    </div>

                    <div style={styles.listRow}>
                      <span style={styles.label}>Ödeme Tarihi:</span>
                      <span>
                        {getItemOdemeTarihi(item)
                          ? new Date(
                              getItemOdemeTarihi(item),
                            ).toLocaleDateString("tr-TR")
                          : "-"}
                      </span>
                    </div>

                    {finansalDetayGorebilir && (
                      <>
                        <div style={styles.listRow}>
                          <span style={styles.label}>IBAN:</span>
                          <span>{getItemIban(item) || "-"}</span>
                        </div>

                        <div style={styles.listRow}>
                          <span style={styles.label}>Hesap Adı:</span>
                          <span>{getItemHesapAdi(item) || "-"}</span>
                        </div>

                        <div style={styles.listRow}>
                          <span style={styles.label}>Not:</span>
                          <span>{getItemAciklama(item) || "-"}</span>
                        </div>
                      </>
                    )}

                    <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                      {ilgiliAsamadaOnaylayabilir(item) &&
                        durum !== "ODENDI" &&
                        durum !== "REDDEDILDI" && (
                          <>
                            <button
                              type="button"
                              style={styles.miniApproveButton}
                              onClick={() => guncelle(item.id, "ONAYLANDI")}
                            >
                              Onayla
                            </button>

                            <button
                              type="button"
                              style={styles.miniRejectButton}
                              onClick={() => guncelle(item.id, "REDDEDILDI")}
                            >
                              Reddet
                            </button>
                          </>
                        )}

                      {ilgiliKaydiSilebilir(item) && (
                        <button
                          type="button"
                          style={styles.miniDeleteButton}
                          onClick={() => handleSil(item.id)}
                        >
                          Sil
                        </button>
                      )}

                      {rol === "MUHASEBE" &&
                        getItemDurum(item) === "ONAYLANDI" && (
                          <button
                            type="button"
                            style={{
                              padding: "6px 12px",
                              background: "#2563eb",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "14px",
                              fontWeight: 600,
                            }}
                            onClick={() => guncelle(item.id, "ODENDI")}
                          >
                            Ödendi
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

const styles = {
  loginCard: {
    background: "white",
    padding: "40px",
    borderRadius: "24px",
    width: "100%",
    maxWidth: "520px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
    border: "1px solid #E5E7EB",
  },

  loginTitle: {
    margin: 0,
    marginBottom: "10px",
    fontSize: "48px",
    textAlign: "center",
    color: "#111827",
  },

  loginSubtitle: {
    marginTop: 0,
    marginBottom: "24px",
    textAlign: "center",
    color: "#6B7280",
    fontSize: "16px",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  listItem: {
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    padding: "18px",
    background: "#FFFFFF",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
    transition: "all 0.25s ease",
    marginBottom: "14px",
    cursor: "pointer",
  },

  listItemHover: {
    transform: "translateY(-8px) scale(1.01)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
    border: "2px solid #2563EB",
    background: "#F8FAFF",
  },

  listItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
    paddingBottom: "10px",
    borderBottom: "1px solid #E5E7EB",
  },

  listItemTitle: {
    fontSize: "17px",
    fontWeight: 800,
    color: "#111827",
  },

  container: {
    minHeight: "100vh",
    background: "#f3f4f6",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },

  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "16px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },

  topBar: {
    maxWidth: "1200px",
    margin: "0 auto 24px auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },

  mainGrid: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    gap: "16px",
  },

  card: {
    background: "white",
    padding: "40px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    textAlign: "center",
    border: "1px solid #e5e7eb",
  },

  cardLarge: {
    background: "white",
    padding: "20px",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    border: "1px solid #E5E7EB",
  },

  title: {
    marginBottom: "20px",
    fontSize: "36px",
    color: "#111827",
  },

  pageTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#111827",
    fontWeight: 800,
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "16px",
    fontSize: "18px",
    color: "#111827",
    fontWeight: 800,
    textAlign: "center",
  },

  userInfo: {
    marginTop: "8px",
    color: "#4b5563",
    fontSize: "15px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
    boxSizing: "border-box",
    outline: "none",
    background: "white",
    minHeight: "48px",
  },

  readonlyInput: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    boxSizing: "border-box",
    outline: "none",
    background: "#f9fafb",
    color: "#374151",
    minHeight: "48px",
  },

  textarea: {
    width: "100%",
    minHeight: "100px",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },

  button: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "4px",
    fontSize: "16px",
  },

  miniApproveButton: {
    padding: "6px 12px",
    background: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  miniRejectButton: {
    padding: "6px 12px",
    background: "#ea4335",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  miniDeleteButton: {
    padding: "6px 12px",
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  testBox: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#555",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "14px",
    lineHeight: 1.7,
  },

  errorBox: {
    marginTop: "14px",
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "14px",
    fontWeight: 600,
  },

  successBox: {
    marginTop: "14px",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "14px",
    fontWeight: 600,
  },

  emptyText: {
    color: "#6b7280",
    fontSize: "15px",
    padding: "12px 0",
  },

  listWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  listRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "6px 0",
    fontSize: "14px",
    flexWrap: "wrap",
  },

  label: {
    fontWeight: 700,
    color: "#374151",
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px",
    marginBottom: "16px",
  },

  summaryBox: {
    display: "flex",
    gap: "24px",
    padding: "16px 18px",
    borderRadius: "14px",
    background: "#F9FAFB",
    border: "1px solid #E5E7EB",
    color: "#111827",
    fontSize: "18px",
    fontWeight: 600,
  },
};
