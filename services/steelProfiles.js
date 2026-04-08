// ============================================
// Çelik Profil Veritabanı
// Türkiye'de yaygın kullanılan çelik profiller
// Ağırlık: kg/metre cinsinden
// ============================================

const STEEL_PROFILES = {
  // IPE Profiller (I Profil - Avrupa Standardı)
  IPE: {
    "IPE 80": { height: 80, width: 46, weight: 6.0, area: 7.64 },
    "IPE 100": { height: 100, width: 55, weight: 8.1, area: 10.3 },
    "IPE 120": { height: 120, width: 64, weight: 10.4, area: 13.2 },
    "IPE 140": { height: 140, width: 73, weight: 12.9, area: 16.4 },
    "IPE 160": { height: 160, width: 82, weight: 15.8, area: 20.1 },
    "IPE 180": { height: 180, width: 91, weight: 18.8, area: 23.9 },
    "IPE 200": { height: 200, width: 100, weight: 22.4, area: 28.5 },
    "IPE 220": { height: 220, width: 110, weight: 26.2, area: 33.4 },
    "IPE 240": { height: 240, width: 120, weight: 30.7, area: 39.1 },
    "IPE 270": { height: 270, width: 135, weight: 36.1, area: 45.9 },
    "IPE 300": { height: 300, width: 150, weight: 42.2, area: 53.8 },
    "IPE 330": { height: 330, width: 160, weight: 49.1, area: 62.6 },
    "IPE 360": { height: 360, width: 170, weight: 57.1, area: 72.7 },
    "IPE 400": { height: 400, width: 180, weight: 66.3, area: 84.5 },
    "IPE 450": { height: 450, width: 190, weight: 77.6, area: 98.8 },
    "IPE 500": { height: 500, width: 200, weight: 90.7, area: 116 },
    "IPE 550": { height: 550, width: 210, weight: 106, area: 134 },
    "IPE 600": { height: 600, width: 220, weight: 122, area: 156 },
  },

  // HEA Profiller (Geniş Flanşlı I Profil)
  HEA: {
    "HEA 100": { height: 96, width: 100, weight: 16.7, area: 21.2 },
    "HEA 120": { height: 114, width: 120, weight: 19.9, area: 25.3 },
    "HEA 140": { height: 133, width: 140, weight: 24.7, area: 31.4 },
    "HEA 160": { height: 152, width: 160, weight: 30.4, area: 38.8 },
    "HEA 180": { height: 171, width: 180, weight: 35.5, area: 45.3 },
    "HEA 200": { height: 190, width: 200, weight: 42.3, area: 53.8 },
    "HEA 220": { height: 210, width: 220, weight: 50.5, area: 64.3 },
    "HEA 240": { height: 230, width: 240, weight: 60.3, area: 76.8 },
    "HEA 260": { height: 250, width: 260, weight: 68.2, area: 86.8 },
    "HEA 280": { height: 270, width: 280, weight: 76.4, area: 97.3 },
    "HEA 300": { height: 290, width: 300, weight: 88.3, area: 112.5 },
    "HEA 320": { height: 310, width: 300, weight: 97.6, area: 124.4 },
    "HEA 340": { height: 330, width: 300, weight: 105, area: 133.5 },
    "HEA 360": { height: 350, width: 300, weight: 112, area: 142.8 },
    "HEA 400": { height: 390, width: 300, weight: 125, area: 159 },
  },

  // HEB Profiller
  HEB: {
    "HEB 100": { height: 100, width: 100, weight: 20.4, area: 26.0 },
    "HEB 120": { height: 120, width: 120, weight: 26.7, area: 34.0 },
    "HEB 140": { height: 140, width: 140, weight: 33.7, area: 43.0 },
    "HEB 160": { height: 160, width: 160, weight: 42.6, area: 54.3 },
    "HEB 180": { height: 180, width: 180, weight: 51.2, area: 65.3 },
    "HEB 200": { height: 200, width: 200, weight: 61.3, area: 78.1 },
    "HEB 220": { height: 220, width: 220, weight: 71.5, area: 91.0 },
    "HEB 240": { height: 240, width: 240, weight: 83.2, area: 106 },
    "HEB 260": { height: 260, width: 260, weight: 93.0, area: 118 },
    "HEB 280": { height: 280, width: 280, weight: 103, area: 131 },
    "HEB 300": { height: 300, width: 300, weight: 117, area: 149 },
  },

  // UPN Profiller (U Profil)
  UPN: {
    "UPN 80": { height: 80, width: 45, weight: 8.64, area: 11.0 },
    "UPN 100": { height: 100, width: 50, weight: 10.6, area: 13.5 },
    "UPN 120": { height: 120, width: 55, weight: 13.4, area: 17.0 },
    "UPN 140": { height: 140, width: 60, weight: 16.0, area: 20.4 },
    "UPN 160": { height: 160, width: 65, weight: 18.8, area: 24.0 },
    "UPN 180": { height: 180, width: 70, weight: 22.0, area: 28.0 },
    "UPN 200": { height: 200, width: 75, weight: 25.3, area: 32.2 },
    "UPN 220": { height: 220, width: 80, weight: 29.4, area: 37.4 },
    "UPN 240": { height: 240, width: 85, weight: 33.2, area: 42.3 },
    "UPN 260": { height: 260, width: 90, weight: 37.9, area: 48.3 },
    "UPN 280": { height: 280, width: 95, weight: 41.8, area: 53.3 },
    "UPN 300": { height: 300, width: 100, weight: 46.2, area: 58.8 },
  },

  // Kutu Profil (Dikdörtgen / Kare)
  KUTU: {
    "20x20x2": { height: 20, width: 20, thickness: 2, weight: 1.12 },
    "25x25x2": { height: 25, width: 25, thickness: 2, weight: 1.43 },
    "30x30x2": { height: 30, width: 30, thickness: 2, weight: 1.74 },
    "30x30x3": { height: 30, width: 30, thickness: 3, weight: 2.51 },
    "40x20x2": { height: 40, width: 20, thickness: 2, weight: 1.74 },
    "40x40x2": { height: 40, width: 40, thickness: 2, weight: 2.36 },
    "40x40x3": { height: 40, width: 40, thickness: 3, weight: 3.45 },
    "40x40x4": { height: 40, width: 40, thickness: 4, weight: 4.48 },
    "50x30x2": { height: 50, width: 30, thickness: 2, weight: 2.36 },
    "50x30x3": { height: 50, width: 30, thickness: 3, weight: 3.45 },
    "50x50x2": { height: 50, width: 50, thickness: 2, weight: 2.98 },
    "50x50x3": { height: 50, width: 50, thickness: 3, weight: 4.39 },
    "50x50x4": { height: 50, width: 50, thickness: 4, weight: 5.72 },
    "60x40x2": { height: 60, width: 40, thickness: 2, weight: 2.98 },
    "60x40x3": { height: 60, width: 40, thickness: 3, weight: 4.39 },
    "60x60x3": { height: 60, width: 60, thickness: 3, weight: 5.33 },
    "60x60x4": { height: 60, width: 60, thickness: 4, weight: 6.97 },
    "80x40x2": { height: 80, width: 40, thickness: 2, weight: 3.6 },
    "80x40x3": { height: 80, width: 40, thickness: 3, weight: 5.33 },
    "80x80x3": { height: 80, width: 80, thickness: 3, weight: 7.22 },
    "80x80x4": { height: 80, width: 80, thickness: 4, weight: 9.45 },
    "100x50x3": { height: 100, width: 50, thickness: 3, weight: 6.71 },
    "100x50x4": { height: 100, width: 50, thickness: 4, weight: 8.78 },
    "100x100x3": { height: 100, width: 100, thickness: 3, weight: 9.11 },
    "100x100x4": { height: 100, width: 100, thickness: 4, weight: 11.9 },
    "100x100x5": { height: 100, width: 100, thickness: 5, weight: 14.7 },
    "120x60x3": { height: 120, width: 60, thickness: 3, weight: 8.16 },
    "120x60x4": { height: 120, width: 60, thickness: 4, weight: 10.7 },
    "120x120x4": { height: 120, width: 120, thickness: 4, weight: 14.4 },
    "120x120x5": { height: 120, width: 120, thickness: 5, weight: 17.8 },
    "150x100x4": { height: 150, width: 100, thickness: 4, weight: 15.1 },
    "150x100x5": { height: 150, width: 100, thickness: 5, weight: 18.7 },
    "150x150x5": { height: 150, width: 150, thickness: 5, weight: 22.6 },
    "200x100x4": { height: 200, width: 100, thickness: 4, weight: 18.2 },
    "200x100x5": { height: 200, width: 100, thickness: 5, weight: 22.6 },
    "200x200x5": { height: 200, width: 200, thickness: 5, weight: 30.4 },
    "200x200x6": { height: 200, width: 200, thickness: 6, weight: 36.2 },
  },

  // L Profil (Köşebent - Eşit Kenarlı)
  L: {
    "L 20x20x3": { size: 20, thickness: 3, weight: 0.88 },
    "L 25x25x3": { size: 25, thickness: 3, weight: 1.12 },
    "L 30x30x3": { size: 30, thickness: 3, weight: 1.36 },
    "L 30x30x4": { size: 30, thickness: 4, weight: 1.78 },
    "L 35x35x4": { size: 35, thickness: 4, weight: 2.09 },
    "L 40x40x4": { size: 40, thickness: 4, weight: 2.42 },
    "L 40x40x5": { size: 40, thickness: 5, weight: 2.97 },
    "L 45x45x5": { size: 45, thickness: 5, weight: 3.38 },
    "L 50x50x5": { size: 50, thickness: 5, weight: 3.77 },
    "L 50x50x6": { size: 50, thickness: 6, weight: 4.47 },
    "L 60x60x5": { size: 60, thickness: 5, weight: 4.57 },
    "L 60x60x6": { size: 60, thickness: 6, weight: 5.42 },
    "L 60x60x8": { size: 60, thickness: 8, weight: 7.09 },
    "L 70x70x7": { size: 70, thickness: 7, weight: 7.38 },
    "L 80x80x8": { size: 80, thickness: 8, weight: 9.63 },
    "L 90x90x9": { size: 90, thickness: 9, weight: 12.2 },
    "L 100x100x10": { size: 100, thickness: 10, weight: 15.0 },
    "L 120x120x12": { size: 120, thickness: 12, weight: 21.6 },
    "L 150x150x15": { size: 150, thickness: 15, weight: 33.8 },
  },

  // Boru Profil (Çelik Boru)
  BORU: {
    "Ø21.3x2.0": { diameter: 21.3, thickness: 2.0, weight: 0.95 },
    "Ø26.9x2.3": { diameter: 26.9, thickness: 2.3, weight: 1.39 },
    "Ø33.7x2.6": { diameter: 33.7, thickness: 2.6, weight: 1.99 },
    "Ø42.4x2.6": { diameter: 42.4, thickness: 2.6, weight: 2.55 },
    "Ø42.4x3.2": { diameter: 42.4, thickness: 3.2, weight: 3.09 },
    "Ø48.3x2.6": { diameter: 48.3, thickness: 2.6, weight: 2.93 },
    "Ø48.3x3.2": { diameter: 48.3, thickness: 3.2, weight: 3.56 },
    "Ø60.3x2.9": { diameter: 60.3, thickness: 2.9, weight: 4.11 },
    "Ø60.3x3.6": { diameter: 60.3, thickness: 3.6, weight: 5.03 },
    "Ø76.1x2.9": { diameter: 76.1, thickness: 2.9, weight: 5.24 },
    "Ø76.1x3.6": { diameter: 76.1, thickness: 3.6, weight: 6.44 },
    "Ø88.9x3.2": { diameter: 88.9, thickness: 3.2, weight: 6.76 },
    "Ø101.6x3.6": { diameter: 101.6, thickness: 3.6, weight: 8.70 },
    "Ø114.3x3.6": { diameter: 114.3, thickness: 3.6, weight: 9.83 },
    "Ø139.7x4.0": { diameter: 139.7, thickness: 4.0, weight: 13.4 },
    "Ø168.3x4.5": { diameter: 168.3, thickness: 4.5, weight: 18.2 },
    "Ø219.1x5.0": { diameter: 219.1, thickness: 5.0, weight: 26.4 },
  },

  // Trapez Sac
  TRAPEZ: {
    "0.40mm": { thickness: 0.40, weight: 3.77 }, // kg/m²
    "0.45mm": { thickness: 0.45, weight: 4.24 },
    "0.50mm": { thickness: 0.50, weight: 4.71 },
    "0.60mm": { thickness: 0.60, weight: 5.65 },
    "0.70mm": { thickness: 0.70, weight: 6.60 },
    "0.80mm": { thickness: 0.80, weight: 7.54 },
  },
};

// Çelik çatı iş kalemleri ve birim fiyatları (TL)
const WORK_ITEMS = {
  celik_imalat: {
    name: "Çelik İmalat (Kesim, Kaynak, Delme)",
    unit: "kg",
    unitPrice: 12,
  },
  celik_montaj: {
    name: "Çelik Montaj (Yerinde Montaj)",
    unit: "kg",
    unitPrice: 8,
  },
  boya_astar: {
    name: "Antipas Astar Boya (2 kat)",
    unit: "kg",
    unitPrice: 5,
  },
  boya_son_kat: {
    name: "Son Kat Boya",
    unit: "kg",
    unitPrice: 4,
  },
  galvaniz: {
    name: "Sıcak Daldırma Galvaniz",
    unit: "kg",
    unitPrice: 15,
  },
  bulon_somun: {
    name: "Bulon-Somun Takımı",
    unit: "adet",
    unitPrice: 8,
  },
  trapez_sac: {
    name: "Trapez Sac (0.50mm boyalı)",
    unit: "m²",
    unitPrice: 180,
  },
  tasima_nakliye: {
    name: "Nakliye",
    unit: "ton",
    unitPrice: 2500,
  },
};

// Yapısal eleman tipleri ve varsayılan profiller
const STRUCTURAL_ELEMENTS = {
  makas: {
    name: "Makas (Çatı Kafesi)",
    description: "Ana taşıyıcı çatı kafes sistemi",
    defaultProfile: "KUTU",
    commonProfiles: ["100x100x4", "120x60x4", "80x80x4", "150x100x5"],
  },
  makas_ust_basi: {
    name: "Makas Üst Başı",
    description: "Makasın üst eğimli elemanı",
    defaultProfile: "KUTU",
    commonProfiles: ["100x50x3", "80x40x3", "60x40x3"],
  },
  makas_alt_basi: {
    name: "Makas Alt Başı",
    description: "Makasın alt yatay elemanı",
    defaultProfile: "KUTU",
    commonProfiles: ["100x50x3", "80x40x3", "60x40x3"],
  },
  makas_dikme: {
    name: "Makas Dikme",
    description: "Makasın düşey ara elemanları",
    defaultProfile: "KUTU",
    commonProfiles: ["50x50x3", "40x40x3", "60x40x3"],
  },
  makas_capraz: {
    name: "Makas Çapraz",
    description: "Makasın çapraz ara elemanları",
    defaultProfile: "KUTU",
    commonProfiles: ["50x50x3", "40x40x3", "50x30x3"],
  },
  asik: {
    name: "Aşık (Çatı Aşığı)",
    description: "Makaslar arası yatay taşıyıcı",
    defaultProfile: "KUTU",
    commonProfiles: ["60x40x3", "80x40x3", "50x50x3"],
  },
  kolon: {
    name: "Kolon (Dikmeler)",
    description: "Düşey taşıyıcı elemanlar",
    defaultProfile: "HEA",
    commonProfiles: ["HEA 200", "HEA 160", "HEA 140", "HEA 120"],
  },
  kiris: {
    name: "Kiriş",
    description: "Yatay taşıyıcı ana elemanlar",
    defaultProfile: "IPE",
    commonProfiles: ["IPE 200", "IPE 240", "IPE 180", "IPE 160"],
  },
  ruzgarlik: {
    name: "Rüzgarlık / Çapraz",
    description: "Rüzgar yükü çaprazları",
    defaultProfile: "L",
    commonProfiles: ["L 50x50x5", "L 60x60x6", "L 40x40x4"],
  },
  altyapi: {
    name: "Altyapı Çeliği",
    description: "Temel bağlantı ve ankraj elemanları",
    defaultProfile: "KUTU",
    commonProfiles: ["200x200x6", "150x150x5"],
  },
};

module.exports = {
  STEEL_PROFILES,
  WORK_ITEMS,
  STRUCTURAL_ELEMENTS,
};
