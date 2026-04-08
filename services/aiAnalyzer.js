// ============================================
// AI Analiz Servisi
// OpenAI API kullanarak çelik çatı yapısal analizi
// ============================================

const OpenAI = require("openai");
const { STEEL_PROFILES, STRUCTURAL_ELEMENTS } = require("./steelProfiles");

let openai = null;

function initOpenAI(apiKey) {
  openai = new OpenAI({ apiKey });
}

/**
 * DXF verisini AI ile analiz eder
 * @param {string} dxfSummary - DXF dosyasından çıkarılan özet metin
 * @returns {object} Yapısal analiz sonuçları
 */
async function analyzeStructure(dxfSummary) {
  if (!openai) {
    throw new Error("OpenAI API başlatılmadı. API key kontrol edin.");
  }

  const profileList = generateProfileList();

  const systemPrompt = `Sen bir çelik yapı mühendisisin. Çelik çatı projelerinin teknik çizimlerini analiz edip, malzeme listesi ve maliyet hesabı çıkarıyorsun.

Görevin: Verilen DXF çizim verisini analiz ederek çelik çatı projesinin yapısal elemanlarını tespit et ve her eleman için gerekli malzeme miktarını hesapla.

Analiz yaparken dikkat etmen gerekenler:
1. Çizgi uzunlukları ve konumları, geometrik şekilleri analiz et
2. Katman (layer) isimlerinden eleman türlerini anla
3. Ölçü yazılarından boyutları oku
4. Tekrarlayan desenleri bul (örn: makasların tekrar eden yapısı)
5. Yapısal elemanların birbirleriyle ilişkisini analiz et

Yapısal Eleman Türleri:
- makas: Ana çatı kafes sistemi (üst başı, alt başı, dikme, çapraz elemanları dahil)
- asik: Makaslar arası yatay taşıyıcılar (aşıklar/mertekler)
- kolon: Düşey taşıyıcılar
- kiris: Yatay ana taşıyıcılar
- ruzgarlik: Rüzgar çaprazları
- altyapi: Temel bağlantı elemanları

Kullanılabilecek Çelik Profiller:
${profileList}

IMPORTANT: Yanıtını SADECE aşağıdaki JSON formatında ver, başka bir şey ekleme:
{
  "projectInfo": {
    "description": "Projenin genel açıklaması",
    "buildingWidth": "Bina genişliği (metre)",
    "buildingLength": "Bina uzunluğu (metre)", 
    "roofSlope": "Çatı eğimi (derece)",
    "numberOfTrusses": "Makas sayısı",
    "trussSpacing": "Makas aralığı (metre)"
  },
  "elements": [
    {
      "id": "benzersiz_id",
      "type": "eleman türü (makas/asik/kolon/kiris/ruzgarlik/altyapi)",
      "name": "Elemanın açıklayıcı adı",
      "profileType": "Profil kategorisi (KUTU/IPE/HEA/UPN/L/BORU)",
      "profileName": "Profil ismi (örn: 100x50x3, IPE 200)",
      "lengthPerUnit": "Birim başına uzunluk (metre)",
      "quantity": "Toplam adet",
      "totalLength": "Toplam uzunluk (metre)",
      "notes": "Ek notlar"
    }
  ],
  "additionalItems": {
    "trapezSac": {
      "needed": true,
      "area": "m² cinsinden alan",
      "thickness": "0.50mm"
    },
    "bolts": {
      "estimated": "tahmini bulon sayısı"
    }
  },
  "notes": ["Genel notlar ve uyarılar"]
}`;

  const userPrompt = `Aşağıdaki DXF çizim verisini analiz et ve çelik çatı projesinin malzeme listesini çıkar:

${dxfSummary}

Lütfen tüm yapısal elemanları detaylı olarak listele. Her makas elemanını (üst başı, alt başı, dikmeler, çaprazlar) ayrı ayrı belirt. Profil seçiminde çelik çatı uygulamalarında yaygın kullanılan profilleri tercih et.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    
    // JSON'u çıkar (markdown code block içinde olabilir)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);
    return result;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("AI yanıtı JSON formatında değil. Lütfen tekrar deneyin.");
    }
    throw new Error(`AI analiz hatası: ${error.message}`);
  }
}

/**
 * Kullanılabilir profil listesini oluşturur
 */
function generateProfileList() {
  let list = "";

  Object.entries(STEEL_PROFILES).forEach(([category, profiles]) => {
    list += `\n${category}:\n`;
    Object.entries(profiles).forEach(([name, data]) => {
      list += `  - ${name}: ${data.weight} kg/m\n`;
    });
  });

  return list;
}

module.exports = {
  initOpenAI,
  analyzeStructure,
};
