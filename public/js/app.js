// ============================================
// Çelik Çatı Makas Hesaplama
// Fotoğraftan oku → Düzenle → Maliyet Hesapla → Export
// ============================================

document.addEventListener("DOMContentLoaded", () => {

  // ============ DOM ============
  const uploadZone = document.getElementById("uploadZone");
  const fileInput = document.getElementById("fileInput");
  const uploadedList = document.getElementById("uploadedList");
  const uploadCount = document.getElementById("uploadCount");
  const btnReadAll = document.getElementById("btnReadAll");

  const loadingSection = document.getElementById("loadingSection");
  const loadingText = document.getElementById("loadingText");
  const loadingSub = document.getElementById("loadingSub");

  const makasDataSection = document.getElementById("makasDataSection");
  const makasDataCount = document.getElementById("makasDataCount");
  const makasTabs = document.getElementById("makasTabs");
  const makasTablesContainer = document.getElementById("makasTablesContainer");

  const summarySection = document.getElementById("summarySection");
  const mergedTableBody = document.getElementById("mergedTableBody");
  const makasWeightSummary = document.getElementById("makasWeightSummary");

  const btnPrint = document.getElementById("btnPrint");
  const btnReset = document.getElementById("btnReset");
  const btnExportCSV = document.getElementById("btnExportCSV");
  const btnSaveProject = document.getElementById("btnSaveProject");
  const btnLoadProject = document.getElementById("btnLoadProject");

  // Cost inputs
  const steelPriceInput = document.getElementById("steelPrice");
  const laborMultInput = document.getElementById("laborMult");
  const wasteFactorInput = document.getElementById("wasteFactor");
  const profitMarginInput = document.getElementById("profitMargin");

  // ============ State ============
  let uploadedFiles = [];
  let makasResults = [];
  let fileCounter = 0;

  // ============ Upload Zone ============
  uploadZone.addEventListener("click", () => fileInput.click());

  uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.classList.add("drag-over");
  });

  uploadZone.addEventListener("dragleave", () => {
    uploadZone.classList.remove("drag-over");
  });

  uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("drag-over");
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
    fileInput.value = "";
  });

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) {
        showAlert("error", `${file.name} bir görsel değil.`);
        return;
      }
      fileCounter++;
      const id = fileCounter;
      const reader = new FileReader();
      reader.onload = (e) => {
        const item = { id, file, thumb: e.target.result, status: "pending" };
        uploadedFiles.push(item);
        renderUploadedList();
        updateUploadCount();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderUploadedList() {
    uploadedList.innerHTML = "";
    uploadedFiles.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "uploaded-item";
      div.id = `upload-${item.id}`;
      const statusText = {
        pending: "⏳ Okunmayı bekliyor",
        reading: "🔄 AI okuyor...",
        done: "✅ Okundu",
        error: "❌ Hata",
      }[item.status];
      div.innerHTML = `
        <img src="${item.thumb}" class="thumb" alt="Makas ${index + 1}">
        <div class="info">
          <div class="name">Makas ${index + 1} — ${escapeHtml(item.file.name)}</div>
          <div class="size">${formatFileSize(item.file.size)}</div>
          <div class="status status-${item.status}">${statusText}</div>
        </div>
        <button class="btn-remove" title="Kaldır">🗑️</button>
      `;
      div.querySelector(".btn-remove").addEventListener("click", () => {
        uploadedFiles = uploadedFiles.filter(f => f.id !== item.id);
        renderUploadedList();
        updateUploadCount();
      });
      uploadedList.appendChild(div);
    });
  }

  function updateUploadCount() {
    uploadCount.textContent = `${uploadedFiles.length} makas`;
    btnReadAll.disabled = uploadedFiles.length === 0;
  }

  function updateItemStatus(id, status) {
    const item = uploadedFiles.find(f => f.id === id);
    if (item) {
      item.status = status;
      const el = document.getElementById(`upload-${id}`);
      if (el) {
        const statusEl = el.querySelector(".status");
        const statusText = {
          pending: "⏳ Okunmayı bekliyor",
          reading: "🔄 AI okuyor...",
          done: "✅ Okundu",
          error: "❌ Hata",
        }[status];
        statusEl.className = `status status-${status}`;
        statusEl.textContent = statusText;
      }
    }
  }

  // ============ Read All Images ============
  btnReadAll.addEventListener("click", async () => {
    if (uploadedFiles.length === 0) return;
    hideAllAlerts();
    makasResults = [];
    btnReadAll.disabled = true;
    loadingSection.classList.add("visible");
    makasDataSection.classList.remove("visible");
    summarySection.classList.remove("visible");

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < uploadedFiles.length; i++) {
      const item = uploadedFiles[i];

      if (i > 0) {
        const waitSec = 20;
        for (let s = waitSec; s > 0; s--) {
          loadingText.textContent = `Sonraki fotoğraf için bekleniyor... (${s}s)`;
          loadingSub.textContent = `Rate limit aşımını önlemek için bekliyoruz`;
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      loadingText.textContent = `Fotoğraf okunuyor... (${i + 1}/${uploadedFiles.length})`;
      loadingSub.textContent = `${item.file.name} — Gemini AI analiz ediyor`;
      updateItemStatus(item.id, "reading");

      try {
        const formData = new FormData();
        formData.append("image", item.file);
        const resp = await fetch("/api/read-image", { method: "POST", body: formData });
        const result = await resp.json();

        if (result.success && result.data) {
          makasResults.push({
            fileId: item.id,
            fileName: item.file.name,
            index: i,
            ...result.data,
          });
          updateItemStatus(item.id, "done");
          successCount++;
        } else {
          updateItemStatus(item.id, "error");
          errorCount++;
          console.error(`Hata (${item.file.name}):`, result.error);
        }
      } catch (err) {
        updateItemStatus(item.id, "error");
        errorCount++;
        console.error(`Fetch hatası (${item.file.name}):`, err);
      }
    }

    loadingSection.classList.remove("visible");
    btnReadAll.disabled = false;

    if (successCount > 0) {
      showAlert("success", `${successCount} makas başarıyla okundu!${errorCount > 0 ? ` ${errorCount} makas okunamadı.` : ""}`);
      displayMakasData();
      rebuildSummary();
    } else {
      showAlert("error", "Hiçbir makas okunamadı. Lütfen daha net fotoğraflar yükleyin veya API key'inizi kontrol edin.");
    }
  });

  // ============ Display Per-Makas Data (with editing) ============
  function displayMakasData() {
    makasDataSection.classList.add("visible");
    makasDataCount.textContent = `${makasResults.length} makas`;
    makasTabs.innerHTML = "";
    makasTablesContainer.innerHTML = "";

    makasResults.forEach((makas, i) => {
      const makasName = makas.makasName || `Makas ${i + 1}`;
      const makasQty = makas.makasQuantity || 1;

      // Tab
      const tab = document.createElement("button");
      tab.className = `makas-tab ${i === 0 ? "active" : ""}`;
      tab.textContent = `${makasName} (x${makasQty})`;
      tab.dataset.index = i;
      tab.addEventListener("click", () => {
        document.querySelectorAll(".makas-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".makas-table-wrapper").forEach(w => w.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`makas-wrapper-${i}`).classList.add("active");
      });
      makasTabs.appendChild(tab);

      // Table Wrapper
      const wrapper = document.createElement("div");
      wrapper.className = `makas-table-wrapper ${i === 0 ? "active" : ""}`;
      wrapper.id = `makas-wrapper-${i}`;
      wrapper.innerHTML = buildMakasHTML(makas, i);
      makasTablesContainer.appendChild(wrapper);

      attachMakasEditing(wrapper, i);
    });

    setTimeout(() => {
      makasDataSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }

  function buildMakasHTML(makas, i) {
    const makasName = makas.makasName || `Makas ${i + 1}`;
    const makasQty = makas.makasQuantity || 1;
    const totalWeight = calcMakasWeight(makas);
    const totalArea = makas.totalAreaSqm || makas.parts?.reduce((s, p) => s + (p.areaSqm || 0), 0) || 0;

    let html = `
      <div class="makas-table-header">
        <div class="makas-info">
          <div class="makas-stat">
            <span class="label">Makas Adı</span>
            <span class="value editable-header" data-field="makasName" data-index="${i}" title="Düzenlemek için tıkla">${escapeHtml(makasName)}</span>
          </div>
          <div class="makas-stat">
            <span class="label">Adet</span>
            <span class="value editable-header" data-field="makasQuantity" data-index="${i}" title="Düzenlemek için tıkla">${makasQty}</span>
          </div>
          <div class="makas-stat">
            <span class="label">1 Makas Ağırlık</span>
            <span class="value" id="makas-unit-weight-${i}">${formatNumber(totalWeight)} kg</span>
          </div>
          <div class="makas-stat">
            <span class="label">Toplam Ağırlık</span>
            <span class="value" id="makas-total-weight-${i}">${formatNumber(totalWeight * makasQty)} kg</span>
          </div>
        </div>
        <div class="makas-actions">
          <button class="btn btn-sm btn-ghost btn-add-part" data-index="${i}">+ Parça Ekle</button>
          <button class="btn btn-sm btn-ghost btn-delete-makas" data-index="${i}">🗑️ Makası Sil</button>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table" id="makas-table-${i}">
          <thead>
            <tr>
              <th>#</th>
              <th>Parça Adı</th>
              <th>Adet</th>
              <th>Kesit / Profil</th>
              <th>Malzeme</th>
              <th>Uzunluk (mm)</th>
              <th>Alan (m²)</th>
              <th>Ağırlık (kg)</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="makas-tbody-${i}">
    `;

    (makas.parts || []).forEach((part, j) => {
      html += buildPartRow(part, j, i);
    });

    html += `
          </tbody>
          <tfoot>
            <tr class="total-footer">
              <td colspan="5" style="text-align:right">TOPLAM</td>
              <td></td>
              <td class="number highlight" id="makas-foot-area-${i}">${formatNumber(totalArea)}</td>
              <td class="number highlight" id="makas-foot-weight-${i}">${formatNumber(totalWeight)} kg</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    return html;
  }

  function buildPartRow(part, j, i) {
    return `
      <tr data-part="${j}" data-makas="${i}">
        <td>${j + 1}</td>
        <td><span class="editable" data-field="name" data-part="${j}" data-makas="${i}">${escapeHtml(part.name || "")}</span></td>
        <td class="number"><span class="editable" data-field="quantity" data-part="${j}" data-makas="${i}">${part.quantity || 1}</span></td>
        <td><span class="editable" data-field="profile" data-part="${j}" data-makas="${i}">${escapeHtml(part.profile || "")}</span></td>
        <td><span class="editable" data-field="material" data-part="${j}" data-makas="${i}">${escapeHtml(part.material || "")}</span></td>
        <td class="number"><span class="editable" data-field="lengthMm" data-part="${j}" data-makas="${i}">${formatNumber(part.lengthMm || 0)}</span></td>
        <td class="number"><span class="editable" data-field="areaSqm" data-part="${j}" data-makas="${i}">${formatNumber(part.areaSqm || 0)}</span></td>
        <td class="number"><span class="editable" data-field="weightKg" data-part="${j}" data-makas="${i}">${formatNumber(part.weightKg || 0)}</span></td>
        <td><button class="btn-row-delete" data-part="${j}" data-makas="${i}" title="Satırı sil">✕</button></td>
      </tr>
    `;
  }

  function attachMakasEditing(wrapper, makasIdx) {
    // Edit header fields (makas name, quantity)
    wrapper.querySelectorAll(".editable-header").forEach(el => {
      el.addEventListener("click", () => startHeaderEdit(el));
    });

    // Edit part cells
    wrapper.querySelectorAll(".editable").forEach(el => {
      el.addEventListener("click", () => startCellEdit(el));
    });

    // Delete row buttons
    wrapper.querySelectorAll(".btn-row-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const partIdx = parseInt(btn.dataset.part);
        const mIdx = parseInt(btn.dataset.makas);
        makasResults[mIdx].parts.splice(partIdx, 1);
        refreshMakasWrapper(mIdx);
        rebuildSummary();
      });
    });

    // Add part button
    wrapper.querySelector(".btn-add-part")?.addEventListener("click", () => {
      makasResults[makasIdx].parts = makasResults[makasIdx].parts || [];
      makasResults[makasIdx].parts.push({
        name: "Yeni Parça",
        quantity: 1,
        profile: "",
        material: "S235",
        lengthMm: 0,
        areaSqm: 0,
        weightKg: 0,
      });
      refreshMakasWrapper(makasIdx);
      rebuildSummary();
    });

    // Delete makas button
    wrapper.querySelector(".btn-delete-makas")?.addEventListener("click", () => {
      if (!confirm(`"${makasResults[makasIdx].makasName || `Makas ${makasIdx + 1}`}" silinsin mi?`)) return;
      makasResults.splice(makasIdx, 1);
      displayMakasData();
      rebuildSummary();
    });
  }

  function startHeaderEdit(el) {
    if (el.querySelector("input")) return;
    const field = el.dataset.field;
    const mIdx = parseInt(el.dataset.index);
    const currentVal = field === "makasQuantity"
      ? (makasResults[mIdx].makasQuantity || 1)
      : (makasResults[mIdx].makasName || "");

    const input = document.createElement("input");
    input.type = field === "makasQuantity" ? "number" : "text";
    input.value = currentVal;
    input.className = "inline-edit-input";
    input.min = 1;
    el.textContent = "";
    el.appendChild(input);
    input.focus();
    input.select();

    const commit = () => {
      const val = field === "makasQuantity" ? (parseInt(input.value) || 1) : input.value.trim();
      makasResults[mIdx][field] = val;
      refreshMakasWrapper(mIdx);
      rebuildSummary();
    };
    input.addEventListener("blur", commit);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); input.blur(); }
      if (e.key === "Escape") { input.value = currentVal; input.blur(); }
    });
  }

  function startCellEdit(el) {
    if (el.querySelector("input")) return;
    const field = el.dataset.field;
    const partIdx = parseInt(el.dataset.part);
    const mIdx = parseInt(el.dataset.makas);
    const part = makasResults[mIdx].parts[partIdx];
    const currentVal = part[field] ?? "";

    const isNum = ["quantity", "lengthMm", "areaSqm", "weightKg"].includes(field);
    const input = document.createElement("input");
    input.type = isNum ? "number" : "text";
    input.value = isNum ? (currentVal || 0) : currentVal;
    input.className = "inline-edit-input";
    if (isNum) { input.min = 0; input.step = field === "quantity" ? 1 : "any"; }
    el.textContent = "";
    el.appendChild(input);
    input.focus();
    input.select();

    const commit = () => {
      const raw = isNum ? parseFloat(input.value) : input.value.trim();
      part[field] = isNaN(raw) ? 0 : raw;
      refreshMakasWrapper(mIdx);
      rebuildSummary();
    };
    input.addEventListener("blur", commit);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); input.blur(); }
      if (e.key === "Escape") { input.value = currentVal; input.blur(); }
      if (e.key === "Tab") {
        e.preventDefault();
        commit();
        // Move to next editable cell
        const allEditable = Array.from(document.querySelectorAll(".editable"));
        const myIdx = allEditable.indexOf(el);
        const nextEl = allEditable[myIdx + (e.shiftKey ? -1 : 1)];
        if (nextEl) nextEl.click();
      }
    });
  }

  function refreshMakasWrapper(mIdx) {
    const wrapper = document.getElementById(`makas-wrapper-${mIdx}`);
    if (!wrapper) return;
    const wasActive = wrapper.classList.contains("active");
    const makas = makasResults[mIdx];
    wrapper.innerHTML = buildMakasHTML(makas, mIdx);
    attachMakasEditing(wrapper, mIdx);
    if (wasActive) wrapper.classList.add("active");

    // Update tab label
    const tab = document.querySelector(`.makas-tab[data-index="${mIdx}"]`);
    if (tab) tab.textContent = `${makas.makasName || `Makas ${mIdx + 1}`} (x${makas.makasQuantity || 1})`;
  }

  function calcMakasWeight(makas) {
    return makas.totalWeightKg || (makas.parts || []).reduce((s, p) => s + (p.weightKg || 0), 0);
  }

  // ============ Merged Summary ============
  function rebuildSummary() {
    if (makasResults.length === 0) {
      summarySection.classList.remove("visible");
      return;
    }
    summarySection.classList.add("visible");
    displayMergedSummary();
    displayCostSummary();
  }

  function getMergedProfiles() {
    const profileMap = {};
    makasResults.forEach(makas => {
      const makasQty = makas.makasQuantity || 1;
      (makas.parts || []).forEach(part => {
        const profile = (part.profile || "Bilinmiyor").trim();
        const material = (part.material || "S235").trim();
        const key = `${profile}|||${material}`;
        if (!profileMap[key]) {
          profileMap[key] = { profile, material, totalParts: 0, totalLengthMm: 0, totalWeightKg: 0 };
        }
        const partQty = (part.quantity || 1) * makasQty;
        profileMap[key].totalParts += partQty;
        profileMap[key].totalLengthMm += (part.lengthMm || 0) * partQty;
        profileMap[key].totalWeightKg += (part.weightKg || 0) * makasQty;
      });
    });
    return Object.values(profileMap).sort((a, b) => a.profile.localeCompare(b.profile));
  }

  function displayMergedSummary() {
    const merged = getMergedProfiles();
    mergedTableBody.innerHTML = "";
    let grandLengthMm = 0;
    let grandWeightKg = 0;

    merged.forEach((item, i) => {
      grandLengthMm += item.totalLengthMm;
      grandWeightKg += item.totalWeightKg;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td><strong>${escapeHtml(item.profile)}</strong></td>
        <td>${escapeHtml(item.material)}</td>
        <td class="number">${item.totalParts}</td>
        <td class="number">${formatNumber(item.totalLengthMm)}</td>
        <td class="number highlight">${formatNumber(item.totalLengthMm / 1000)}</td>
        <td class="number">${formatNumber(item.totalWeightKg)}</td>
      `;
      mergedTableBody.appendChild(tr);
    });

    document.getElementById("mergedTotalLengthMm").textContent = formatNumber(grandLengthMm);
    document.getElementById("mergedTotalLengthM").textContent = `${formatNumber(grandLengthMm / 1000)} m`;
    document.getElementById("mergedTotalWeight").textContent = `${formatNumber(grandWeightKg)} kg`;

    // Per-makas weight cards
    makasWeightSummary.innerHTML = "";
    let allTotalWeight = 0;
    makasResults.forEach((makas, i) => {
      const makasName = makas.makasName || `Makas ${i + 1}`;
      const makasQty = makas.makasQuantity || 1;
      const unitWeight = calcMakasWeight(makas);
      const totalWeight = unitWeight * makasQty;
      allTotalWeight += totalWeight;

      const card = document.createElement("div");
      card.className = "makas-weight-card";
      card.innerHTML = `
        <div class="mw-name">${escapeHtml(makasName)}</div>
        <div class="mw-qty">${makasQty} adet</div>
        <div class="mw-weight">${formatNumber(unitWeight)} kg</div>
        <div class="mw-total">Toplam: ${formatNumber(totalWeight)} kg</div>
      `;
      makasWeightSummary.appendChild(card);
    });

    const totalCard = document.createElement("div");
    totalCard.className = "makas-weight-card total-card";
    totalCard.innerHTML = `
      <div class="mw-name">GENEL TOPLAM</div>
      <div class="mw-qty">${makasResults.length} farklı makas tipi</div>
      <div class="mw-weight">${formatNumber(allTotalWeight)} kg</div>
      <div class="mw-total">${formatNumber(allTotalWeight / 1000)} ton</div>
    `;
    makasWeightSummary.appendChild(totalCard);
  }

  // ============ Cost Summary ============
  function getCostParams() {
    return {
      steelPricePerKg: parseFloat(steelPriceInput?.value) || 35,
      laborMult: parseFloat(laborMultInput?.value) || 1.0,
      wasteFactor: 1 + (parseFloat(wasteFactorInput?.value) || 7) / 100,
      profitMargin: (parseFloat(profitMarginInput?.value) || 15) / 100,
    };
  }

  function displayCostSummary() {
    const { steelPricePerKg, laborMult, wasteFactor, profitMargin } = getCostParams();
    let totalWeight = 0;
    makasResults.forEach(makas => {
      const qty = makas.makasQuantity || 1;
      totalWeight += calcMakasWeight(makas) * qty;
    });

    const weightWithWaste = totalWeight * wasteFactor;
    const materialCost = weightWithWaste * steelPricePerKg;
    const imalatCost = weightWithWaste * 12 * laborMult;
    const montajCost = weightWithWaste * 8 * laborMult;
    const boyaCost = weightWithWaste * 9;
    const nakliyeCost = Math.ceil(weightWithWaste / 1000) * 2500;
    const subtotal = materialCost + imalatCost + montajCost + boyaCost + nakliyeCost;
    const profit = subtotal * profitMargin;
    const grandTotal = subtotal + profit;
    const kdv = grandTotal * 0.20;
    const grandTotalWithKDV = grandTotal + kdv;

    const costBody = document.getElementById("costTableBody");
    if (!costBody) return;

    costBody.innerHTML = `
      <tr><td>Ham Çelik Malzeme (fire dahil)</td><td class="number">${formatNumber(weightWithWaste)} kg</td><td class="number highlight">${formatTL(materialCost)}</td></tr>
      <tr><td>Çelik İmalat (Kesim/Kaynak/Delme)</td><td class="number">${formatNumber(weightWithWaste)} kg</td><td class="number">${formatTL(imalatCost)}</td></tr>
      <tr><td>Çelik Montaj</td><td class="number">${formatNumber(weightWithWaste)} kg</td><td class="number">${formatTL(montajCost)}</td></tr>
      <tr><td>Boya + Astar</td><td class="number">${formatNumber(weightWithWaste)} kg</td><td class="number">${formatTL(boyaCost)}</td></tr>
      <tr><td>Nakliye</td><td class="number">${formatNumber(Math.ceil(weightWithWaste / 1000))} ton</td><td class="number">${formatTL(nakliyeCost)}</td></tr>
    `;

    setEl("costSubtotal", formatTL(subtotal));
    setEl("costProfit", formatTL(profit));
    setEl("costGrandTotal", formatTL(grandTotal));
    setEl("costKDV", formatTL(kdv));
    setEl("costGrandTotalKDV", formatTL(grandTotalWithKDV));
    setEl("costTotalWeight", `${formatNumber(weightWithWaste)} kg`);
    setEl("costPerKgTotal", `${formatTL(grandTotalWithKDV / (weightWithWaste || 1))} / kg`);
  }

  // Re-calc cost when inputs change
  ["steelPrice", "laborMult", "wasteFactor", "profitMargin"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", () => {
      if (makasResults.length > 0) displayCostSummary();
    });
  });

  // ============ CSV Export ============
  btnExportCSV?.addEventListener("click", () => {
    if (makasResults.length === 0) {
      showAlert("warning", "Export için önce makas verisi yükleyin.");
      return;
    }
    const merged = getMergedProfiles();
    const lines = [
      ["#", "Profil / Kesit", "Malzeme", "Toplam Parça", "Toplam Uzunluk (mm)", "Toplam Uzunluk (m)", "Toplam Ağırlık (kg)"]
    ];
    merged.forEach((item, i) => {
      lines.push([
        i + 1,
        item.profile,
        item.material,
        item.totalParts,
        item.totalLengthMm.toFixed(0),
        (item.totalLengthMm / 1000).toFixed(3),
        item.totalWeightKg.toFixed(2),
      ]);
    });

    // Also add per-makas sheets
    lines.push([]);
    lines.push(["MAKAS DETAYLARI"]);
    makasResults.forEach((makas, mi) => {
      lines.push([]);
      lines.push([`${makas.makasName || `Makas ${mi+1}`}`, `Adet: ${makas.makasQuantity || 1}`]);
      lines.push(["Parça", "Adet", "Profil", "Malzeme", "Uzunluk (mm)", "Alan (m²)", "Ağırlık (kg)"]);
      (makas.parts || []).forEach(p => {
        lines.push([p.name, p.quantity, p.profile, p.material, p.lengthMm, p.areaSqm, p.weightKg]);
      });
    });

    const csv = lines.map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `celik-cati-malzeme-listesi-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert("success", "CSV dosyası indirildi!");
  });

  // ============ Save / Load Project ============
  btnSaveProject?.addEventListener("click", () => {
    if (makasResults.length === 0) {
      showAlert("warning", "Kaydedilecek veri yok.");
      return;
    }
    const projectData = {
      version: "1.0",
      savedAt: new Date().toISOString(),
      makasResults,
    };
    const json = JSON.stringify(projectData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `celik-cati-proje-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert("success", "Proje dosyası kaydedildi!");
  });

  btnLoadProject?.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!data.makasResults || !Array.isArray(data.makasResults)) {
            showAlert("error", "Geçersiz proje dosyası.");
            return;
          }
          makasResults = data.makasResults;
          displayMakasData();
          rebuildSummary();
          showAlert("success", `Proje yüklendi: ${data.makasResults.length} makas`);
        } catch {
          showAlert("error", "Proje dosyası okunamadı.");
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });

  // ============ Print & Reset ============
  btnPrint?.addEventListener("click", () => {
    document.querySelectorAll(".makas-table-wrapper").forEach(w => w.classList.add("active"));
    setTimeout(() => window.print(), 100);
  });

  btnReset?.addEventListener("click", () => {
    if (makasResults.length > 0 && !confirm("Tüm veriler silinecek. Devam edilsin mi?")) return;
    uploadedFiles = [];
    makasResults = [];
    fileCounter = 0;
    renderUploadedList();
    updateUploadCount();
    makasDataSection.classList.remove("visible");
    summarySection.classList.remove("visible");
    hideAllAlerts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ============ Alerts ============
  function showAlert(type, msg) {
    hideAllAlerts();
    const el = document.getElementById(`alert${type.charAt(0).toUpperCase() + type.slice(1)}`);
    const txt = document.getElementById(`alert${type.charAt(0).toUpperCase() + type.slice(1)}Text`);
    if (el && txt) { txt.textContent = msg; el.classList.add("visible"); }
    if (type === "success") setTimeout(() => el?.classList.remove("visible"), 6000);
  }

  function hideAllAlerts() {
    document.querySelectorAll(".alert").forEach(e => e.classList.remove("visible"));
  }

  // ============ Utilities ============
  function formatNumber(num) {
    if (num == null || isNaN(num)) return "0";
    return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
  }

  function formatTL(num) {
    if (num == null || isNaN(num)) return "₺0";
    return "₺" + new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
});
