(() => {
  "use strict";

  const STORAGE_KEY = "dsgvoChangeHistory.v2";
  const REQUIRED_FIELDS = [
    "change_id",
    "date",
    "change_type",
    "description",
    "security_change",
    "affected_systems",
    "personal_data",
    "customers_affected",
    "external_parties",
  ];
  const INPUT_FIELDS = [
    ...REQUIRED_FIELDS,
    "source",
    "source_url",
    "number_of_customers",
    "old_text",
    "new_text",
    "notes",
    "email_sender",
    "email_subject",
    "email_received_at",
  ];
  const OUTPUT_FIELDS = [
    "impact_level",
    "gdpr_relevance",
    "affected_documents",
    "measures",
    "customer_information_required",
    "manual_review_required",
    "summary",
    "warnings",
  ];
  const TABLE_COLUMNS = [
    "change_id",
    "date",
    "change_type",
    "impact_level",
    "gdpr_relevance",
    "affected_documents",
    "measures",
    "customer_information_required",
    "manual_review_required",
    "summary",
    "warnings",
  ];
  const KNOWN_CHANGE_TYPES = [
    "Neuer Dienstleister",
    "Wechsel Dienstleister",
    "Neuer Subunternehmer",
    "Freelancer mit Zugriff",
    "Software-Update ohne Datenbezug",
    "Software-Update mit Datenbezug",
    "API-Änderung",
    "API entfernt",
    "Infrastrukturänderung",
    "Backup geändert",
    "Rechte-/Rollenkonzept geändert",
    "Verschlüsselung geändert",
    "Neues System",
    "System wird abgeschaltet",
    "Datenschutzvorfall / Sicherheitsereignis",
    "Sonstiges / Unklar",
  ];
  const YES_NO_UNKNOWN = ["Ja", "Nein", "Unklar"];
  const HIGH_CHANGE_TYPES = new Set([
    "Neuer Dienstleister",
    "Wechsel Dienstleister",
    "Neuer Subunternehmer",
    "Freelancer mit Zugriff",
    "API-Änderung",
    "API entfernt",
    "Infrastrukturänderung",
    "Backup geändert",
    "Rechte-/Rollenkonzept geändert",
    "Verschlüsselung geändert",
    "Datenschutzvorfall / Sicherheitsereignis",
  ]);
  const AVV_CHANGE_TYPES = new Set([
    "Neuer Dienstleister",
    "Wechsel Dienstleister",
    "Neuer Subunternehmer",
    "Freelancer mit Zugriff",
  ]);
  const TOM_CHANGE_TYPES = new Set([
    "Backup geändert",
    "Rechte-/Rollenkonzept geändert",
    "Verschlüsselung geändert",
    "Infrastrukturänderung",
    "Datenschutzvorfall / Sicherheitsereignis",
  ]);
  const FALLBACK_SAMPLE_CHANGES = [
    {
      change_id: "CHG-001",
      date: "2026-06-09",
      change_type: "Neuer Dienstleister",
      description: "Ein neuer lokaler IT-Dienstleister verarbeitet Kundendaten für das Ticketsystem.",
      security_change: "Nein",
      affected_systems: "Ticketsystem",
      personal_data: "Ja",
      customers_affected: "Ja",
      external_parties: "Ja",
      source: "Fallback-Beispieldaten",
      source_url: "",
      number_of_customers: "12",
      old_text: "",
      new_text: "",
      notes: "Anonymisierte Beispieldaten",
      email_sender: "",
      email_subject: "",
      email_received_at: "",
    },
    {
      change_id: "CHG-002",
      date: "2026-06-09",
      change_type: "Software-Update ohne Datenbezug",
      description: "Update einer internen Bibliothek ohne Verarbeitung personenbezogener Daten.",
      security_change: "Nein",
      affected_systems: "Build-System",
      personal_data: "Nein",
      customers_affected: "Nein",
      external_parties: "Nein",
      source: "Fallback-Beispieldaten",
      source_url: "",
      number_of_customers: "0",
      old_text: "",
      new_text: "",
      notes: "Low-Beispiel",
      email_sender: "",
      email_subject: "",
      email_received_at: "",
    },
    {
      change_id: "CHG-003",
      date: "2026-06-09",
      change_type: "API-Änderung",
      description: "CRM API überträgt personenbezogene Kundendaten an ein externes System.",
      security_change: "Ja",
      affected_systems: "CRM API",
      personal_data: "Ja",
      customers_affected: "Ja",
      external_parties: "Ja",
      source: "Fallback-Beispieldaten",
      source_url: "",
      number_of_customers: "5",
      old_text: "",
      new_text: "",
      notes: "API-Beispiel",
      email_sender: "",
      email_subject: "",
      email_received_at: "",
    },
  ];

  let history = [];
  let lastEvaluation = null;

  const $ = (id) => document.getElementById(id);
  const form = $("changeForm");

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    populateSelect("change_type", KNOWN_CHANGE_TYPES);
    populateSelect("security_change", YES_NO_UNKNOWN, "Nein");
    populateSelect("personal_data", YES_NO_UNKNOWN, "Nein");
    populateSelect("customers_affected", YES_NO_UNKNOWN, "Nein");
    populateSelect("external_parties", YES_NO_UNKNOWN, "Nein");
    $("date").value = new Date().toISOString().slice(0, 10);
    $("source").value = "Manuelle Eingabe";

    if (!isLocalStorageAvailable()) {
      showMessage("storageWarning", "localStorage ist nicht verfügbar. Bewertungen funktionieren, aber gespeicherte Daten bleiben nach dem Schließen möglicherweise nicht erhalten.", "warning");
    }

    history = loadHistory();
    renderHistory();
    bindEvents();
    if (history.length === 0) loadSampleData(true);
  }

  function bindEvents() {
    $("evaluateBtn").addEventListener("click", evaluateCurrentForm);
    $("saveBtn").addEventListener("click", saveLastEvaluation);
    $("resetFormBtn").addEventListener("click", resetForm);
    $("loadSamplesBtn").addEventListener("click", loadSampleData);
    $("csvUpload").addEventListener("change", importCsvFile);
    $("exportJsonBtn").addEventListener("click", exportJson);
    $("exportCsvBtn").addEventListener("click", exportCsv);
    $("clearDataBtn").addEventListener("click", clearLocalData);
    bindOptionalClick("topExportJsonBtn", exportJson);
    bindOptionalClick("topLoadSamplesBtn", () => loadSampleData(false));
    bindOptionalClick("topClearDataBtn", clearLocalData);
    $("applyEmailTextBtn").addEventListener("click", applyEmailText);
    $("emlUpload").addEventListener("change", importEmlFile);
  }

  function bindOptionalClick(id, handler) {
    const element = $(id);
    if (element) element.addEventListener("click", handler);
  }

  function populateSelect(id, options, selectedValue) {
    const select = $(id);
    select.innerHTML = "";
    options.forEach((option) => {
      const item = document.createElement("option");
      item.value = option;
      item.textContent = option;
      if (option === selectedValue) item.selected = true;
      select.appendChild(item);
    });
  }

  function isLocalStorageAvailable() {
    try {
      const key = "__dsgvo_test__";
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadHistory() {
    if (!isLocalStorageAvailable()) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      showMessage("storageWarning", "Gespeicherte lokale Daten konnten nicht gelesen werden. Bitte exportiere vorhandene Daten regelmäßig als Sicherung.", "warning");
      return [];
    }
  }

  function persistHistory() {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  function getFormData() {
    const data = {};
    INPUT_FIELDS.forEach((field) => {
      const element = $(field);
      data[field] = element ? String(element.value || "").trim() : "";
    });
    return data;
  }

  function setFormData(data) {
    INPUT_FIELDS.forEach((field) => {
      const element = $(field);
      if (!element) return;
      element.value = data[field] || "";
    });
  }

  function normalizeChange(change) {
    const normalized = {};
    INPUT_FIELDS.forEach((field) => {
      normalized[field] = String(change[field] ?? "").trim();
    });
    return normalized;
  }

  function validateChange(change) {
    const errors = [];
    REQUIRED_FIELDS.forEach((field) => {
      if (!change[field]) errors.push(`Pflichtfeld '${field}' fehlt.`);
    });
    if (change.date && Number.isNaN(Date.parse(`${change.date}T00:00:00`))) {
      errors.push("Pflichtfeld 'date' enthält kein gültiges Datum.");
    }
    ["security_change", "personal_data", "customers_affected", "external_parties"].forEach((field) => {
      if (change[field] && !YES_NO_UNKNOWN.includes(change[field])) {
        errors.push(`Feld '${field}' muss Ja, Nein oder Unklar sein.`);
      }
    });
    if (change.number_of_customers) {
      const number = Number(change.number_of_customers);
      if (!Number.isFinite(number) || number < 0) {
        errors.push("Feld 'number_of_customers' muss eine nicht-negative Zahl sein.");
      }
    }
    return errors;
  }

  function evaluateCurrentForm() {
    const change = normalizeChange(getFormData());
    const errors = validateChange(change);
    if (errors.length > 0) {
      lastEvaluation = null;
      $("saveBtn").disabled = true;
      showMessage("validationErrors", errors.join("<br>"), "danger");
      renderEmptyResult("Bitte korrigiere die Validierungsfehler und bewerte erneut.");
      return;
    }
    hideMessage("validationErrors");
    lastEvaluation = { ...change, ...evaluateChange(change) };
    renderResult(lastEvaluation);
    $("saveBtn").disabled = false;
  }

  function evaluateChange(change) {
    const warnings = [];
    let score = 1;
    const changeType = change.change_type;
    const customerCount = Number(change.number_of_customers || 0);

    if (change.external_parties === "Ja" && change.personal_data === "Ja") score = Math.max(score, 3);
    if (HIGH_CHANGE_TYPES.has(changeType)) score = Math.max(score, 3);
    if (change.customers_affected === "Ja" && customerCount > 10) score = Math.max(score, 3);

    const gdprFields = [change.security_change, change.personal_data, change.customers_affected, change.external_parties];
    if (gdprFields.includes("Unklar")) score = Math.max(score, 2);
    if (!KNOWN_CHANGE_TYPES.includes(changeType) || changeType === "Sonstiges / Unklar") {
      score = Math.max(score, 2);
      warnings.push("Änderungstyp ist unbekannt oder unklar; manuelle Prüfung erforderlich.");
    }
    if (
      change.personal_data === "Nein" &&
      change.external_parties === "Nein" &&
      change.customers_affected === "Nein" &&
      change.security_change === "Nein" &&
      score === 1
    ) {
      score = 1;
    }
    if (change.old_text && change.new_text && change.old_text === change.new_text) {
      warnings.push("Alter und neuer Text sind identisch; keine Textänderung erkannt.");
    }

    const impact = score === 3 ? "High" : score === 2 ? "Medium" : "Low";
    const avv = isAvvAffected(change);
    const tom = isTomAffected(change);
    const customerInfo = impact === "High" && change.customers_affected === "Ja";
    const documents = ["Änderungshistorie"];
    if (avv) documents.push("AVV");
    if (tom) documents.push("TOM");
    if (customerInfo) documents.push("Kundeninformation");
    if (change.change_type === "Datenschutzvorfall / Sicherheitsereignis") documents.push("Incident-Dokumentation");

    const measures = deriveMeasures(change, documents, impact, customerInfo);
    const manualReview = impact !== "Low" || warnings.length > 0;

    return {
      impact_level: impact,
      gdpr_relevance: impact === "Low" ? "Keine direkte DSGVO-Relevanz" : "DSGVO-relevant",
      affected_documents: documents,
      measures,
      customer_information_required: customerInfo,
      manual_review_required: manualReview,
      summary: `${change.change_type} wurde als ${impact} bewertet. Betroffene Dokumente: ${documents.join(", ")}.`,
      warnings,
    };
  }

  function isAvvAffected(change) {
    return AVV_CHANGE_TYPES.has(change.change_type) || (change.external_parties === "Ja" && change.personal_data === "Ja");
  }

  function isTomAffected(change) {
    return change.security_change === "Ja" || TOM_CHANGE_TYPES.has(change.change_type);
  }

  function deriveMeasures(change, documents, impact, customerInfo) {
    const measures = [];
    if (documents.includes("AVV")) {
      measures.push("AVV prüfen", "AVV aktualisieren");
      if (["Neuer Dienstleister", "Wechsel Dienstleister"].includes(change.change_type)) measures.push("AVV neu abschließen");
      if (change.change_type === "Neuer Subunternehmer") measures.push("Subunternehmerliste prüfen");
      if (change.personal_data === "Ja") measures.push("Datenarten aktualisieren");
    }
    if (documents.includes("TOM")) {
      measures.push("Zugriffskontrolle prüfen");
      if (["Rechte-/Rollenkonzept geändert", "Datenschutzvorfall / Sicherheitsereignis"].includes(change.change_type)) measures.push("Zugangskontrolle prüfen");
      if (change.change_type === "Verschlüsselung geändert") measures.push("Verschlüsselung prüfen");
      if (change.change_type === "Backup geändert") measures.push("Backup-Konzept prüfen");
      if (change.change_type === "Infrastrukturänderung") measures.push("Netzwerk-/Firewallregel prüfen");
      if (change.change_type === "Datenschutzvorfall / Sicherheitsereignis") measures.push("Protokollierung prüfen");
    }
    if (customerInfo) {
      measures.push("Kundeninformation vorbereiten", "Mail-Template generieren");
    } else {
      measures.push("keine Kundeninfo nötig");
    }
    if (impact === "Medium" || impact === "High") measures.push("interne Info vorbereiten");
    if (impact === "Medium") measures.push("manuelle Prüfung durchführen");
    if (change.email_subject || change.email_sender) measures.push("Anhang prüfen");
    return [...new Set(measures)];
  }

  function saveLastEvaluation() {
    if (!lastEvaluation) return;
    history.push({ ...lastEvaluation, saved_at: new Date().toISOString() });
    persistHistory();
    renderHistory();
    $("saveBtn").disabled = true;
    renderResult(lastEvaluation, "Änderung wurde lokal im Browser gespeichert.");
  }

  function renderResult(result, savedMessage = "") {
    const levelClass = result.impact_level.toLowerCase();
    const guidance = result.impact_level === "High"
      ? "Hohe Relevanz: deutliche Prüfung von AVV/TOM und ggf. Kundeninformation erforderlich."
      : result.impact_level === "Medium"
        ? "Manuelle Prüfung erforderlich."
        : "Low: nur dokumentieren.";

    $("resultBox").className = "result-card";
    $("resultBox").innerHTML = `
      <span class="impact-badge impact-${levelClass}">${escapeHtml(result.impact_level)}</span>
      <div class="result-message ${levelClass}">${escapeHtml(guidance)}</div>
      ${savedMessage ? `<div class="alert warning">${escapeHtml(savedMessage)}</div>` : ""}
      <div><strong>DSGVO-Relevanz:</strong> ${escapeHtml(result.gdpr_relevance)}</div>
      <div><strong>Betroffene Dokumente:</strong>${renderChipList(result.affected_documents)}</div>
      <div><strong>Maßnahmen:</strong>${renderChipList(result.measures)}</div>
      <div><strong>Kundeninformation erforderlich:</strong> ${result.customer_information_required ? "Ja" : "Nein"}</div>
      <div><strong>Manuelle Prüfung erforderlich:</strong> ${result.manual_review_required ? "Ja" : "Nein"}</div>
      <div><strong>Zusammenfassung:</strong> ${escapeHtml(result.summary)}</div>
      ${result.warnings.length ? `<div class="alert warning"><strong>Warnungen:</strong><br>${result.warnings.map(escapeHtml).join("<br>")}</div>` : ""}
    `;
  }

  function renderEmptyResult(message) {
    $("resultBox").className = "empty-state";
    $("resultBox").textContent = message;
  }

  function renderChipList(items) {
    return `<ul class="chip-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function renderHistory() {
    renderDashboardStats();
    const thead = document.querySelector("#historyTable thead");
    const tbody = document.querySelector("#historyTable tbody");
    thead.innerHTML = `<tr>${TABLE_COLUMNS.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>`;
    if (history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${TABLE_COLUMNS.length}">Noch keine Änderungen gespeichert. Nutze das Formular oder lade Beispieldaten.</td></tr>`;
      return;
    }
    tbody.innerHTML = history.map((entry) => `
      <tr>
        ${TABLE_COLUMNS.map((column) => `<td>${formatTableValue(column, entry[column])}</td>`).join("")}
      </tr>
    `).join("");
  }

  function renderDashboardStats() {
    const totals = history.reduce((acc, entry) => {
      const level = String(entry.impact_level || "").toLowerCase();
      if (level === "high") acc.high += 1;
      if (level === "medium") acc.medium += 1;
      if (level === "low") acc.low += 1;
      if (entry.manual_review_required) acc.openReviews += 1;
      const timestamp = entry.saved_at || entry.date;
      if (timestamp && (!acc.lastUpdate || String(timestamp) > String(acc.lastUpdate))) acc.lastUpdate = timestamp;
      return acc;
    }, { low: 0, medium: 0, high: 0, openReviews: 0, lastUpdate: "" });

    setText("statTotalChanges", history.length);
    setText("statOpenReviews", totals.openReviews);
    setText("statHighImpact", totals.high);
    setText("statLastUpdate", formatStatDate(totals.lastUpdate));
    setText("statImpactSplit", `Low: ${totals.low} · Med: ${totals.medium} · High: ${totals.high}`);
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = String(value);
  }

  function formatStatDate(value) {
    if (!value) return "Heute";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatTableValue(column, value) {
    if (column === "impact_level") {
      const level = String(value || "").toLowerCase();
      return `<span class="table-impact impact-${level}">${escapeHtml(value || "")}</span>`;
    }
    if (Array.isArray(value)) return escapeHtml(value.join("; "));
    if (typeof value === "boolean") return value ? "Ja" : "Nein";
    return escapeHtml(value ?? "");
  }

  async function loadSampleData(isAutomatic = false) {
    hideMessage("importErrors");
    try {
      const response = await fetch("data/sample_changes.csv", { cache: "no-store" });
      if (!response.ok) throw new Error("Beispieldatei konnte nicht geladen werden.");
      const text = await response.text();
      importRows(parseCsv(text), "CSV-Beispieldatei");
    } catch (error) {
      const evaluated = FALLBACK_SAMPLE_CHANGES.map((change) => ({ ...change, ...evaluateChange(change), saved_at: new Date().toISOString() }));
      history = [...history, ...evaluated];
      persistHistory();
      renderHistory();
      showMessage("importErrors", isAutomatic ? "Beim direkten Öffnen per Doppelklick konnte data/sample_changes.csv eventuell nicht geladen werden. Fallback-Beispieldaten aus script.js wurden lokal geladen." : "Browser konnte data/sample_changes.csv nicht direkt laden. Fallback-Beispieldaten aus script.js wurden geladen.", "warning");
    }
  }

  function importCsvFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importRows(parseCsv(String(reader.result || "")), file.name);
      } catch (error) {
        showMessage("importErrors", `CSV konnte nicht gelesen werden: ${escapeHtml(error.message)}`, "danger");
      } finally {
        event.target.value = "";
      }
    };
    reader.onerror = () => showMessage("importErrors", "CSV-Datei konnte nicht gelesen werden.", "danger");
    reader.readAsText(file, "utf-8");
  }

  function importRows(rows, sourceName) {
    hideMessage("importErrors");
    if (!rows.length) {
      showMessage("importErrors", "Die CSV-Datei ist leer.", "danger");
      return;
    }
    const missingColumns = REQUIRED_FIELDS.filter((field) => !(field in rows[0]));
    if (missingColumns.length) {
      showMessage("importErrors", `Ungültige CSV-Spalten. Fehlende Pflichtspalten: ${missingColumns.join(", ")}`, "danger");
      return;
    }

    const imported = [];
    const errors = [];
    rows.forEach((row, index) => {
      const change = normalizeChange(row);
      const validationErrors = validateChange(change);
      if (validationErrors.length) {
        errors.push(`Zeile ${index + 2}: ${validationErrors.join("; ")}`);
        return;
      }
      imported.push({ ...change, ...evaluateChange(change), saved_at: new Date().toISOString() });
    });

    if (imported.length) {
      history = [...history, ...imported];
      persistHistory();
      renderHistory();
    }
    const message = `${imported.length} Einträge aus ${escapeHtml(sourceName)} importiert.${errors.length ? " Fehler: " + errors.map(escapeHtml).join(" | ") : ""}`;
    showMessage("importErrors", message, "warning");
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;
    const normalizedText = text.replace(/^\uFEFF/, "");

    for (let i = 0; i < normalizedText.length; i += 1) {
      const char = normalizedText[i];
      const next = normalizedText[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(cell);
        if (row.some((value) => value.trim() !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
    if (!rows.length) return [];

    const headers = rows[0].map((header) => header.trim());
    return rows.slice(1).map((values) => {
      const object = {};
      headers.forEach((header, index) => {
        object[header] = values[index] || "";
      });
      return object;
    });
  }

  function toCsv(rows, columns) {
    const escapeCell = (value) => {
      const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    return [columns.join(","), ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(","))].join("\n");
  }

  function exportJson() {
    downloadFile("dsgvo-change-history.json", JSON.stringify(history, null, 2), "application/json");
  }

  function exportCsv() {
    downloadFile("dsgvo-change-history.csv", toCsv(history, [...INPUT_FIELDS, ...OUTPUT_FIELDS, "saved_at"]), "text/csv;charset=utf-8");
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function clearLocalData() {
    if (!confirm("Lokale Änderungshistorie wirklich löschen? Exportiere die Daten vorher, wenn du sie behalten möchtest.")) return;
    history = [];
    if (isLocalStorageAvailable()) localStorage.removeItem(STORAGE_KEY);
    renderHistory();
    renderEmptyResult("Lokale Änderungshistorie wurde geleert.");
  }

  function resetForm() {
    form.reset();
    populateSelect("security_change", YES_NO_UNKNOWN, "Nein");
    populateSelect("personal_data", YES_NO_UNKNOWN, "Nein");
    populateSelect("customers_affected", YES_NO_UNKNOWN, "Nein");
    populateSelect("external_parties", YES_NO_UNKNOWN, "Nein");
    $("date").value = new Date().toISOString().slice(0, 10);
    $("source").value = "Manuelle Eingabe";
    lastEvaluation = null;
    $("saveBtn").disabled = true;
    hideMessage("validationErrors");
    renderEmptyResult("Noch keine Bewertung. Fülle das Formular aus und klicke auf „Änderung bewerten“.");
  }

  function applyEmailText() {
    const text = $("emailText").value.trim();
    if (!text) return;
    const parsed = parseEmlText(text);
    applyEmailData(parsed, text);
  }

  function importEmlFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      applyEmailData(parseEmlText(text), text);
      event.target.value = "";
    };
    reader.onerror = () => showMessage("validationErrors", ".eml-Datei konnte nicht gelesen werden.", "danger");
    reader.readAsText(file, "utf-8");
  }

  function parseEmlText(text) {
    const getHeader = (name) => {
      const regex = new RegExp(`^${name}:\\s*(.+)$`, "im");
      const match = text.match(regex);
      return match ? match[1].trim() : "";
    };
    const body = text.includes("\n\n") ? text.split(/\r?\n\r?\n/).slice(1).join("\n\n").trim() : text.trim();
    return {
      sender: getHeader("From") || getHeader("Absender"),
      subject: getHeader("Subject") || getHeader("Betreff"),
      date: getHeader("Date") || getHeader("Datum"),
      body,
    };
  }

  function applyEmailData(parsed, originalText) {
    $("email_sender").value = parsed.sender || $("email_sender").value;
    $("email_subject").value = parsed.subject || $("email_subject").value;
    $("email_received_at").value = parsed.date || $("email_received_at").value;
    $("source").value = "Manuell eingefügte E-Mail";
    if (!$("description").value.trim()) $("description").value = parsed.body || originalText;
    if (!$("change_id").value.trim()) $("change_id").value = `EMAIL-${Date.now()}`;
    if (!$("affected_systems").value.trim()) $("affected_systems").value = "Aus E-Mail zu prüfen";
    const combined = `${parsed.subject} ${parsed.body}`.toLowerCase();
    if (combined.includes("dienstleister")) $("change_type").value = "Neuer Dienstleister";
    if (combined.includes("subunternehmer")) $("change_type").value = "Neuer Subunternehmer";
    if (combined.includes("kundendaten") || combined.includes("personenbezogen")) {
      $("personal_data").value = "Ja";
      $("customers_affected").value = "Ja";
    }
    if (["Neuer Dienstleister", "Neuer Subunternehmer"].includes($("change_type").value)) $("external_parties").value = "Ja";
    $("notes").value = [$("notes").value, "E-Mail-Inhalt wurde manuell übernommen; vor dem Speichern prüfen."].filter(Boolean).join("\n");
  }

  function showMessage(id, html, type) {
    const element = $(id);
    element.className = `alert ${type}`;
    element.innerHTML = html;
  }

  function hideMessage(id) {
    const element = $(id);
    element.className = "alert hidden";
    element.textContent = "";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
