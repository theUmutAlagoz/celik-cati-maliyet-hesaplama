# 🏗️ Çelik Çatı Makas Hesaplama Sistemi

Çelik çatı projelerinde makas malzeme listelerini **fotoğraftan otomatik okuyan**, düzenlenebilir tablolar ve maliyet hesabı sunan web uygulaması.

## ✨ Özellikler

- **📸 AI ile Fotoğraf Okuma** — Google Gemini AI, makas malzeme listesi tablolarını fotoğraftan otomatik okur
- **✏️ Inline Düzenleme** — Hücrelere tıklayarak AI'ın okuduğu değerleri kolayca düzeltin; parça ekle/sil
- **📦 Birleşik Sipariş Listesi** — Farklı makas tiplerindeki aynı profiller otomatik birleştirilir
- **💰 Maliyet Hesaplama** — Özelleştirilebilir çelik fiyatı, işçilik, fire payı ve kar marjı; KDV dahil toplam
- **📥 CSV Export** — Malzeme listesini Excel'de açmak için CSV olarak indirin
- **💾 Proje Kaydet/Yükle** — Çalışmayı JSON dosyası olarak kaydet, sonra kaldığın yerden devam et
- **🖨️ Yazdır / PDF** — Tüm tabloları tek sayfada yazdır veya PDF'e aktar

## 🚀 Kurulum

### 1. Repoyu klonla

```bash
git clone https://github.com/kullanici/celik-cati-hesap.git
cd celik-cati-hesap
```

### 2. Bağımlılıkları yükle

```bash
npm install
```

### 3. API Key ayarla

```bash
cp .env.example .env
```

`.env` dosyasını aç ve Gemini API key'ini ekle:

```env
GEMINI_API_KEY=buraya-gercek-api-key-gir
```

> **Gemini API Key almak için:** [Google AI Studio](https://aistudio.google.com/app/apikey) — ücretsiz

### 4. Sunucuyu başlat

```bash
npm start
```

Geliştirme modunda (hot reload):

```bash
npm run dev
```

Tarayıcıda aç: [http://localhost:3000](http://localhost:3000)

---

## 📖 Kullanım

1. **Fotoğraf yükle** — Her makas tipi için malzeme listesi tablosunun fotoğrafını veya ekran görüntüsünü yükle
2. **AI ile oku** — "Tüm Fotoğrafları AI ile Oku" butonuna tıkla; Gemini her tablodaki verileri çıkarır
3. **Düzenle** — Hatalı okunan değerleri hücreye tıklayarak düzelt; yeni parça ekle veya sil
4. **Maliyet hesapla** — Çelik birim fiyatı ve diğer parametreleri girerek KDV dahil maliyet görün
5. **Export / Kaydet** — CSV olarak indir ya da projeyi JSON dosyası olarak kaydet

## 🛠️ Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Backend | Node.js + Express |
| AI | Google Gemini 2.5 Flash |
| Frontend | Vanilla JS + CSS |
| Dosya Yükleme | Multer |

## 📁 Proje Yapısı

```
celik-cati-hesap/
├── server.js              # Express sunucu + Gemini API endpoint
├── services/
│   ├── steelProfiles.js   # Çelik profil veritabanı (IPE, HEA, kutu vb.)
│   ├── costCalculator.js  # Maliyet hesaplama servisi
│   ├── aiAnalyzer.js      # AI analiz servisi
│   └── dxfParser.js       # DXF dosya ayrıştırıcı
├── public/
│   ├── index.html         # Ana sayfa
│   ├── css/style.css      # Stiller
│   └── js/app.js          # Frontend mantığı
├── .env.example           # Örnek environment dosyası (API key yok)
├── .gitignore
└── README.md
```

## ⚙️ Environment Değişkenleri

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `GEMINI_API_KEY` | Google Gemini API key | — (zorunlu) |
| `PORT` | Sunucu portu | `3000` |

## 🧮 Maliyet Kalemleri

- Ham çelik malzeme (fire dahil)
- İmalat işçiliği (kesim, kaynak, delme)
- Montaj işçiliği
- Boya (antipas astar + son kat)
- Nakliye
- Kar marjı
- KDV (%20)

## 📝 Notlar

- Gemini API ücretsiz tier'da rate limit var; birden fazla fotoğraf yüklendiğinde sistem otomatik 20 sn bekler
- Desteklenen görsel formatları: JPG, PNG, BMP, WebP, GIF (maks 20MB)
- En iyi sonuç için tabloyu net gösteren, gölgesiz ekran görüntüleri kullanın

## 📄 Lisans

MIT
