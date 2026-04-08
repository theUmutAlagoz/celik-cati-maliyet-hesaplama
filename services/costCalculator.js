// ============================================
// Maliyet Hesaplama Servisi
// Yapısal analiz sonuçlarından maliyet hesabı
// ============================================

const { STEEL_PROFILES, WORK_ITEMS } = require("./steelProfiles");

/**
 * AI analiz sonuçlarından detaylı maliyet hesabı yapar
 * @param {object} analysisResult - AI analizinden gelen sonuç
 * @param {object} options - Hesaplama seçenekleri
 * @returns {object} Detaylı maliyet raporu
 */
function calculateCost(analysisResult, options = {}) {
  const steelPricePerKg = options.steelPricePerKg || 35; // TL/kg
  const laborMultiplier = options.laborMultiplier || 1.0;
  const wasteFactor = options.wasteFactor || 1.07; // %7 fire payı
  const profitMargin = options.profitMargin || 0.15; // %15 kar marjı

  const elements = analysisResult.elements || [];
  const materialList = [];
  let totalWeight = 0;

  // Her eleman için hesaplama
  elements.forEach((element) => {
    const profileData = findProfileData(
      element.profileType,
      element.profileName
    );
    const weightPerMeter = profileData ? profileData.weight : estimateWeight(element);
    const totalLength = parseFloat(element.totalLength) || 0;
    const quantity = parseInt(element.quantity) || 1;

    // Toplam uzunluk (fire dahil)
    const totalLengthWithWaste = totalLength * wasteFactor;

    // Toplam ağırlık
    const weight = totalLengthWithWaste * weightPerMeter;
    totalWeight += weight;

    materialList.push({
      id: element.id,
      type: element.type,
      name: element.name,
      profileType: element.profileType,
      profileName: element.profileName,
      weightPerMeter: weightPerMeter,
      lengthPerUnit: parseFloat(element.lengthPerUnit) || 0,
      quantity: quantity,
      totalLength: totalLength,
      totalLengthWithWaste: round(totalLengthWithWaste),
      weight: round(weight),
      materialCost: round(weight * steelPricePerKg),
      notes: element.notes || "",
    });
  });

  // Malzeme maliyetleri
  const materialCost = round(totalWeight * steelPricePerKg);

  // İşçilik maliyetleri
  const workCosts = {
    imalat: round(totalWeight * WORK_ITEMS.celik_imalat.unitPrice * laborMultiplier),
    montaj: round(totalWeight * WORK_ITEMS.celik_montaj.unitPrice * laborMultiplier),
    boyaAstar: round(totalWeight * WORK_ITEMS.boya_astar.unitPrice),
    boyaSonKat: round(totalWeight * WORK_ITEMS.boya_son_kat.unitPrice),
  };

  // Ek malzeme maliyetleri
  const additionalCosts = {};

  // Trapez sac
  if (analysisResult.additionalItems?.trapezSac?.needed) {
    const sacArea = parseFloat(analysisResult.additionalItems.trapezSac.area) || 0;
    additionalCosts.trapezSac = {
      name: "Trapez Sac (0.50mm boyalı)",
      quantity: sacArea,
      unit: "m²",
      unitPrice: WORK_ITEMS.trapez_sac.unitPrice,
      total: round(sacArea * WORK_ITEMS.trapez_sac.unitPrice),
    };
  }

  // Bulon-somun
  if (analysisResult.additionalItems?.bolts?.estimated) {
    const boltCount = parseInt(analysisResult.additionalItems.bolts.estimated) || 0;
    additionalCosts.bulonSomun = {
      name: "Bulon-Somun Takımı",
      quantity: boltCount,
      unit: "adet",
      unitPrice: WORK_ITEMS.bulon_somun.unitPrice,
      total: round(boltCount * WORK_ITEMS.bulon_somun.unitPrice),
    };
  }

  // Nakliye
  const tonaj = totalWeight / 1000;
  additionalCosts.nakliye = {
    name: "Nakliye",
    quantity: round(tonaj),
    unit: "ton",
    unitPrice: WORK_ITEMS.tasima_nakliye.unitPrice,
    total: round(Math.ceil(tonaj) * WORK_ITEMS.tasima_nakliye.unitPrice),
  };

  // Toplam ek malzeme maliyeti
  const totalAdditionalCost = Object.values(additionalCosts).reduce(
    (sum, item) => sum + item.total, 0
  );

  // Toplam iş maliyeti
  const totalWorkCost = Object.values(workCosts).reduce((sum, cost) => sum + cost, 0);

  // Genel toplam
  const subtotal = materialCost + totalWorkCost + totalAdditionalCost;
  const profit = round(subtotal * profitMargin);
  const grandTotal = round(subtotal + profit);

  // KDV
  const kdv = round(grandTotal * 0.20);
  const grandTotalWithKDV = round(grandTotal + kdv);

  return {
    projectInfo: analysisResult.projectInfo || {},
    materialList: materialList,
    summary: {
      totalWeight: round(totalWeight),
      totalWeightTon: round(totalWeight / 1000),
      materialCost: materialCost,
      workCosts: workCosts,
      totalWorkCost: totalWorkCost,
      additionalCosts: additionalCosts,
      totalAdditionalCost: totalAdditionalCost,
      subtotal: subtotal,
      profitMargin: `%${profitMargin * 100}`,
      profit: profit,
      grandTotal: grandTotal,
      kdv: kdv,
      grandTotalWithKDV: grandTotalWithKDV,
    },
    parameters: {
      steelPricePerKg: steelPricePerKg,
      laborMultiplier: laborMultiplier,
      wasteFactor: wasteFactor,
      profitMargin: profitMargin,
    },
    notes: analysisResult.notes || [],
  };
}

/**
 * Profil verisini bulur
 */
function findProfileData(profileType, profileName) {
  if (!profileType || !profileName) return null;

  const category = STEEL_PROFILES[profileType];
  if (!category) return null;

  // Tam eşleşme
  if (category[profileName]) return category[profileName];

  // Profil ismiyle arama (örn: "IPE 200" -> "IPE 200")
  const fullName = `${profileType} ${profileName}`;
  if (category[fullName]) return category[fullName];

  // Kısmi eşleşme
  const keys = Object.keys(category);
  const match = keys.find(
    (k) =>
      k.includes(profileName) ||
      profileName.includes(k) ||
      k.replace(/\s/g, "") === profileName.replace(/\s/g, "")
  );

  return match ? category[match] : null;
}

/**
 * Profil verisi bulunamazsa tahmini ağırlık hesaplar
 */
function estimateWeight(element) {
  // Varsayılan ağırlıklar (kg/m)
  const defaults = {
    makas: 8.0,
    asik: 5.0,
    kolon: 42.0,
    kiris: 22.0,
    ruzgarlik: 4.0,
    altyapi: 30.0,
  };
  return defaults[element.type] || 10.0;
}

/**
 * Sayıyı yuvarlar
 */
function round(num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

module.exports = {
  calculateCost,
};
