// ============================================
// DXF Dosya Ayrıştırıcı
// DXF dosyalarını parse edip yapısal veri çıkarır
// ============================================

const DxfParser = require("dxf-parser");
const fs = require("fs");
const path = require("path");

/**
 * DXF dosyasını parse eder ve yapısal verileri çıkarır
 * @param {string} filePath - DXF dosyasının yolu
 * @returns {object} Parse edilmiş yapısal veri
 */
function parseDxfFile(filePath) {
  const parser = new DxfParser();
  const fileContent = fs.readFileSync(filePath, "utf-8");

  let dxf;
  try {
    dxf = parser.parseSync(fileContent);
  } catch (err) {
    throw new Error(`DXF dosyası parse edilemedi: ${err.message}`);
  }

  if (!dxf) {
    throw new Error("DXF dosyası boş veya geçersiz.");
  }

  // Tüm varlıkları (entities) çıkar
  const entities = dxf.entities || [];

  // Katmanları (layers) çıkar
  const layers = {};
  if (dxf.tables && dxf.tables.layer && dxf.tables.layer.layers) {
    Object.entries(dxf.tables.layer.layers).forEach(([name, layer]) => {
      layers[name] = {
        name: name,
        color: layer.color,
        visible: layer.visible !== false,
      };
    });
  }

  // Blokları çıkar
  const blocks = {};
  if (dxf.blocks) {
    Object.entries(dxf.blocks).forEach(([name, block]) => {
      if (!name.startsWith("*")) {
        blocks[name] = {
          name: name,
          entities: (block.entities || []).length,
          position: block.position,
        };
      }
    });
  }

  // Entity türlerine göre sınıflandır
  const classified = classifyEntities(entities);

  // Boyut bilgilerini çıkar
  const dimensions = extractDimensions(entities);

  // Çizim sınırlarını hesapla
  const bounds = calculateBounds(entities);

  // Metin bilgilerini çıkar (ölçüler, notlar)
  const texts = extractTexts(entities);

  return {
    summary: {
      totalEntities: entities.length,
      layerCount: Object.keys(layers).length,
      blockCount: Object.keys(blocks).length,
      bounds: bounds,
    },
    layers: layers,
    blocks: blocks,
    entities: classified,
    dimensions: dimensions,
    texts: texts,
    rawEntitiesSummary: generateEntitySummary(entities),
  };
}

/**
 * Varlıkları türlerine göre sınıflandırır
 */
function classifyEntities(entities) {
  const result = {
    lines: [],
    polylines: [],
    circles: [],
    arcs: [],
    dimensions: [],
    texts: [],
    inserts: [],
    others: [],
  };

  entities.forEach((entity) => {
    const simplified = simplifyEntity(entity);

    switch (entity.type) {
      case "LINE":
        result.lines.push(simplified);
        break;
      case "LWPOLYLINE":
      case "POLYLINE":
        result.polylines.push(simplified);
        break;
      case "CIRCLE":
        result.circles.push(simplified);
        break;
      case "ARC":
        result.arcs.push(simplified);
        break;
      case "DIMENSION":
        result.dimensions.push(simplified);
        break;
      case "TEXT":
      case "MTEXT":
        result.texts.push(simplified);
        break;
      case "INSERT":
        result.inserts.push(simplified);
        break;
      default:
        result.others.push(simplified);
    }
  });

  return result;
}

/**
 * Entity'yi basitleştirir (gereksiz verileri atar)
 */
function simplifyEntity(entity) {
  const base = {
    type: entity.type,
    layer: entity.layer || "0",
    color: entity.color,
  };

  switch (entity.type) {
    case "LINE":
      return {
        ...base,
        start: { x: round(entity.vertices?.[0]?.x || entity.startPoint?.x || 0), y: round(entity.vertices?.[0]?.y || entity.startPoint?.y || 0) },
        end: { x: round(entity.vertices?.[1]?.x || entity.endPoint?.x || 0), y: round(entity.vertices?.[1]?.y || entity.endPoint?.y || 0) },
        length: calculateLineLength(entity),
      };
    case "LWPOLYLINE":
    case "POLYLINE":
      const vertices = (entity.vertices || []).map((v) => ({
        x: round(v.x),
        y: round(v.y),
      }));
      return {
        ...base,
        vertices: vertices,
        closed: entity.shape || false,
        totalLength: calculatePolylineLength(entity),
      };
    case "CIRCLE":
      return {
        ...base,
        center: { x: round(entity.center?.x || 0), y: round(entity.center?.y || 0) },
        radius: round(entity.radius || 0),
      };
    case "ARC":
      return {
        ...base,
        center: { x: round(entity.center?.x || 0), y: round(entity.center?.y || 0) },
        radius: round(entity.radius || 0),
        startAngle: round(entity.startAngle || 0),
        endAngle: round(entity.endAngle || 0),
      };
    case "DIMENSION":
      return {
        ...base,
        dimensionType: entity.dimensionType,
        text: entity.text,
        measurement: entity.measurement,
      };
    case "TEXT":
    case "MTEXT":
      return {
        ...base,
        text: entity.text || entity.string || "",
        position: { x: round(entity.startPoint?.x || entity.position?.x || 0), y: round(entity.startPoint?.y || entity.position?.y || 0) },
        height: entity.textHeight || entity.height,
      };
    case "INSERT":
      return {
        ...base,
        blockName: entity.name,
        position: { x: round(entity.position?.x || 0), y: round(entity.position?.y || 0) },
        scale: { x: entity.xScale || 1, y: entity.yScale || 1 },
        rotation: entity.rotation || 0,
      };
    default:
      return base;
  }
}

/**
 * Çizgi uzunluğunu hesaplar
 */
function calculateLineLength(entity) {
  const x1 = entity.vertices?.[0]?.x || entity.startPoint?.x || 0;
  const y1 = entity.vertices?.[0]?.y || entity.startPoint?.y || 0;
  const x2 = entity.vertices?.[1]?.x || entity.endPoint?.x || 0;
  const y2 = entity.vertices?.[1]?.y || entity.endPoint?.y || 0;
  return round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
}

/**
 * Polyline toplam uzunluğunu hesaplar
 */
function calculatePolylineLength(entity) {
  const vertices = entity.vertices || [];
  let totalLength = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    const dx = vertices[i + 1].x - vertices[i].x;
    const dy = vertices[i + 1].y - vertices[i].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  if (entity.shape && vertices.length > 2) {
    const dx = vertices[0].x - vertices[vertices.length - 1].x;
    const dy = vertices[0].y - vertices[vertices.length - 1].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  return round(totalLength);
}

/**
 * Boyut bilgilerini çıkarır
 */
function extractDimensions(entities) {
  return entities
    .filter((e) => e.type === "DIMENSION")
    .map((e) => ({
      type: e.dimensionType,
      text: e.text,
      measurement: e.measurement,
      layer: e.layer,
    }));
}

/**
 * Metin bilgilerini çıkarır
 */
function extractTexts(entities) {
  return entities
    .filter((e) => e.type === "TEXT" || e.type === "MTEXT")
    .map((e) => ({
      text: e.text || e.string || "",
      position: {
        x: round(e.startPoint?.x || e.position?.x || 0),
        y: round(e.startPoint?.y || e.position?.y || 0),
      },
      layer: e.layer,
      height: e.textHeight || e.height,
    }));
}

/**
 * Çizim sınırlarını hesaplar
 */
function calculateBounds(entities) {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  entities.forEach((entity) => {
    const points = getEntityPoints(entity);
    points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
  });

  if (minX === Infinity) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  return {
    minX: round(minX),
    minY: round(minY),
    maxX: round(maxX),
    maxY: round(maxY),
    width: round(maxX - minX),
    height: round(maxY - minY),
  };
}

/**
 * Entity'den nokta koordinatlarını çıkarır
 */
function getEntityPoints(entity) {
  const points = [];
  switch (entity.type) {
    case "LINE":
      if (entity.startPoint) points.push(entity.startPoint);
      if (entity.endPoint) points.push(entity.endPoint);
      if (entity.vertices) entity.vertices.forEach((v) => points.push(v));
      break;
    case "LWPOLYLINE":
    case "POLYLINE":
      (entity.vertices || []).forEach((v) => points.push(v));
      break;
    case "CIRCLE":
    case "ARC":
      if (entity.center) {
        const r = entity.radius || 0;
        points.push({ x: entity.center.x - r, y: entity.center.y - r });
        points.push({ x: entity.center.x + r, y: entity.center.y + r });
      }
      break;
    case "TEXT":
    case "MTEXT":
      if (entity.startPoint) points.push(entity.startPoint);
      if (entity.position) points.push(entity.position);
      break;
    case "INSERT":
      if (entity.position) points.push(entity.position);
      break;
  }
  return points;
}

/**
 * Entity özet istatistiklerini oluşturur
 */
function generateEntitySummary(entities) {
  const counts = {};
  const layerCounts = {};

  entities.forEach((e) => {
    counts[e.type] = (counts[e.type] || 0) + 1;
    const layer = e.layer || "0";
    layerCounts[layer] = (layerCounts[layer] || 0) + 1;
  });

  return {
    byType: counts,
    byLayer: layerCounts,
  };
}

/**
 * Sayıyı yuvarlar
 */
function round(num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * AI analizi için özet metin oluşturur
 */
function generateAISummary(parsedData) {
  let summary = "";

  summary += `## Çizim Genel Bilgiler\n`;
  summary += `- Toplam Eleman Sayısı: ${parsedData.summary.totalEntities}\n`;
  summary += `- Katman Sayısı: ${parsedData.summary.layerCount}\n`;
  summary += `- Blok Sayısı: ${parsedData.summary.blockCount}\n`;
  summary += `- Çizim Boyutları: ${parsedData.summary.bounds.width}mm x ${parsedData.summary.bounds.height}mm\n\n`;

  // Katman bilgileri
  summary += `## Katmanlar\n`;
  Object.values(parsedData.layers).forEach((layer) => {
    summary += `- ${layer.name}\n`;
  });
  summary += "\n";

  // Entity sayıları
  summary += `## Eleman Dağılımı\n`;
  if (parsedData.rawEntitiesSummary.byType) {
    Object.entries(parsedData.rawEntitiesSummary.byType).forEach(
      ([type, count]) => {
        summary += `- ${type}: ${count} adet\n`;
      }
    );
  }
  summary += "\n";

  // Çizgiler (ilk 50 tanesi)
  if (parsedData.entities.lines.length > 0) {
    summary += `## Çizgiler (${parsedData.entities.lines.length} adet)\n`;
    const linesToShow = parsedData.entities.lines.slice(0, 100);
    linesToShow.forEach((line, i) => {
      summary += `${i + 1}. Katman: ${line.layer}, Başlangıç: (${line.start.x}, ${line.start.y}), Bitiş: (${line.end.x}, ${line.end.y}), Uzunluk: ${line.length}mm\n`;
    });
    if (parsedData.entities.lines.length > 100) {
      summary += `... ve ${parsedData.entities.lines.length - 100} çizgi daha\n`;
    }
    summary += "\n";
  }

  // Polyline'lar
  if (parsedData.entities.polylines.length > 0) {
    summary += `## Polyline'lar (${parsedData.entities.polylines.length} adet)\n`;
    const polylinesToShow = parsedData.entities.polylines.slice(0, 50);
    polylinesToShow.forEach((pl, i) => {
      summary += `${i + 1}. Katman: ${pl.layer}, Köşe Sayısı: ${pl.vertices.length}, Toplam Uzunluk: ${pl.totalLength}mm, Kapalı: ${pl.closed ? "Evet" : "Hayır"}\n`;
    });
    summary += "\n";
  }

  // Ölçü yazıları
  if (parsedData.dimensions.length > 0) {
    summary += `## Ölçüler (${parsedData.dimensions.length} adet)\n`;
    parsedData.dimensions.forEach((dim, i) => {
      summary += `${i + 1}. Değer: ${dim.measurement || dim.text || "bilinmiyor"}, Katman: ${dim.layer}\n`;
    });
    summary += "\n";
  }

  // Metin bilgileri
  if (parsedData.texts.length > 0) {
    summary += `## Metin/Notlar (${parsedData.texts.length} adet)\n`;
    parsedData.texts.forEach((txt, i) => {
      summary += `${i + 1}. "${txt.text}" - Konum: (${txt.position.x}, ${txt.position.y}), Katman: ${txt.layer}\n`;
    });
    summary += "\n";
  }

  // Bloklar
  if (Object.keys(parsedData.blocks).length > 0) {
    summary += `## Bloklar\n`;
    Object.values(parsedData.blocks).forEach((block) => {
      summary += `- ${block.name}: ${block.entities} eleman\n`;
    });
    summary += "\n";
  }

  // Katman bazlı eleman sayıları
  summary += `## Katman Bazlı Eleman Sayıları\n`;
  if (parsedData.rawEntitiesSummary.byLayer) {
    Object.entries(parsedData.rawEntitiesSummary.byLayer).forEach(
      ([layer, count]) => {
        summary += `- ${layer}: ${count} eleman\n`;
      }
    );
  }

  return summary;
}

module.exports = {
  parseDxfFile,
  generateAISummary,
};
