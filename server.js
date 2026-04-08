// ============================================
// Çelik Çatı Maliyet Hesaplama Sistemi - Sunucu
// Google Gemini ile fotoğraftan makas verisi okuma
// ============================================

require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

// Gemini Client
let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key-here") {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  console.log("✅ Google Gemini API bağlantısı hazır.");
} else {
  console.warn("⚠️  Gemini API key ayarlanmamış. .env dosyasına GEMINI_API_KEY ekleyin.");
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Uploads klasörü
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer - görsel yükleme
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".jpg", ".jpeg", ".png", ".bmp", ".webp", ".gif"];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Sadece görsel dosyaları kabul edilir (JPG, PNG, BMP, WebP)."));
    }
  },
});

// ============================================
// API: Görsel yükle ve Gemini ile oku
// ============================================
app.post("/api/read-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Görsel yüklenmedi." });
    }

    if (!model) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: "Gemini API key ayarlanmamış. .env dosyasına GEMINI_API_KEY ekleyin.",
      });
    }

    const filePath = req.file.path;
    console.log(`📸 Görsel yüklendi: ${req.file.originalname}`);

    // Görseli base64'e çevir
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString("base64");

    // MIME type belirle
    const ext = path.extname(req.file.originalname).toLowerCase();
    const mimeMap = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".bmp": "image/bmp",
      ".webp": "image/webp",
      ".gif": "image/gif",
    };
    const mimeType = mimeMap[ext] || "image/jpeg";

    console.log("🤖 Gemini görsel analizi başlatılıyor...");

    const prompt = `Sen bir çelik yapı mühendisisin. Bu görselde bir çelik çatı makas malzeme listesi tablosu var.

Tabloyu DİKKATLİCE oku ve aşağıdaki kurallara uy:

KURALLAR:
1. Tablodaki HER satırı oku, hiçbirini atlama
2. Sayıları DOĞRU oku - özellikle uzunluk ve ağırlık değerlerini dikkatli oku
3. Ondalık ayıracına dikkat et (nokta veya virgül olabilir)
4. Uzunluk mm cinsinden (milimetre)
5. Ağırlık kg cinsinden
6. Makas adını bul (TRS001, TRS002 vb. gibi bir isim olabilir)
7. Sağ üstte veya tabloda "Adet" bilgisi varsa onu da oku (kaç adet bu makastan üretilecek)
8. Toplam satırını da oku ve doğrula

SADECE aşağıdaki JSON formatında cevap ver, JSON dışında HİÇBİR ŞEY yazma:
{
  "makasName": "makas adı (TRS001 vb.)",
  "makasQuantity": 1,
  "parts": [
    {
      "name": "parça adı",
      "quantity": 1,
      "profile": "kesit bilgisi (SHS 100*5, Dbpl 10*90 vb.)",
      "material": "malzeme (S235 vb.)",
      "lengthMm": 0,
      "areaSqm": 0,
      "weightKg": 0
    }
  ],
  "totalAreaSqm": 0,
  "totalWeightKg": 0
}`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    // Retry mantığı - 429 hatasında tekrar dene
    let content = null;
    let lastError = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const waitTime = attempt * 15000; // 15s, 30s, 45s
          console.log(`⏳ Retry ${attempt}/${maxRetries} - ${waitTime / 1000}s bekleniyor...`);
          await new Promise(r => setTimeout(r, waitTime));
        }

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        content = response.text();
        lastError = null;
        break; // Başarılı, döngüden çık
      } catch (retryErr) {
        lastError = retryErr;
        const errMsg = retryErr.message || String(retryErr);
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
          console.log(`⚠️ Rate limit (deneme ${attempt}/${maxRetries})`);
          if (attempt === maxRetries) break;
        } else {
          break; // 429 dışı hata, retry yapma
        }
      }
    }

    // Geçici dosyayı sil
    fs.unlinkSync(filePath);

    if (lastError) {
      throw lastError;
    }

    console.log("✅ Gemini analizi tamamlandı.");

    // JSON'u çıkar
    let jsonStr = content.trim();
    
    // Markdown code block içindeyse çıkar
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      res.json({ success: true, data: parsed });
    } catch (parseError) {
      console.error("JSON parse hatası. Ham yanıt:", content);
      res.status(500).json({
        error: "AI yanıtı işlenemedi. Lütfen daha net bir görsel deneyin.",
        rawResponse: content,
      });
    }
  } catch (error) {
    console.error("Görsel analiz hatası:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const errorMsg = error.message || String(error);

    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      res.status(429).json({
        error: "API kullanım limiti aşıldı. Biraz bekleyip tekrar deneyin.",
      });
    } else if (errorMsg.includes("API_KEY") || errorMsg.includes("401") || errorMsg.includes("PERMISSION_DENIED")) {
      res.status(401).json({
        error: "Gemini API key geçersiz. .env dosyasındaki GEMINI_API_KEY değerini kontrol edin.",
      });
    } else {
      res.status(500).json({ error: errorMsg });
    }
  }
});

// ============================================
// API: Sağlık kontrolü
// ============================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    apiKeySet: !!model,
    provider: "Google Gemini",
  });
});

// Ana sayfa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Hata yakalama
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Dosya boyutu 20MB'dan büyük olamaz." });
    }
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║   🏗️  Çelik Çatı Maliyet Hesaplama Sistemi           ║
║   📡 Sunucu: http://localhost:${PORT}                    ║
║   🤖 AI Motor: Google Gemini 2.0 Flash               ║
║   📸 Fotoğraftan makas verisi okuma aktif             ║
╚══════════════════════════════════════════════════════════╝
  `);
});
