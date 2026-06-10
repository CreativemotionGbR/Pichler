(() => {
  "use strict";

  const STORAGE_KEY = "dsgvoChangeHistory.v2";
  const DOCUMENTS_KEY = "dsgvoDocuments.v1";
  const PROPOSALS_KEY = "dsgvoProposals.v1";
  const SELECTED_DOCUMENT_KEY = "dsgvoSelectedDocument.v1";
  const SELECTED_PROPOSAL_KEY = "dsgvoSelectedProposal.v1";

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
  const TABLE_COLUMNS = ["date", "source", "affected_systems", "impact_level", "measures", "manual_review_required", "change_id"];
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
  const AVV_CHANGE_TYPES = new Set(["Neuer Dienstleister", "Wechsel Dienstleister", "Neuer Subunternehmer", "Freelancer mit Zugriff"]);
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
  const SAMPLE_DOCUMENTS = [
    {
      id: "doc-avv-001",
      type: "AVV",
      title: "Cloud Provider XYZ - Auftragsverarbeitung",
      status: "Freigegeben",
      text: "Der Auftragsverarbeiter verarbeitet Kundendaten ausschließlich innerhalb der Europäischen Union. Subunternehmer werden nur nach vorheriger schriftlicher Zustimmung eingesetzt.",
      versions: [
        { version: "v1.0", date: "2023-09-15", author: "Legal Dept.", text: "AVV Basisfassung mit EU-Verarbeitung." },
        { version: "v2.1", date: "2023-10-24", author: "Dr. M. Schmidt", text: "Aktuelle AVV-Fassung mit Subunternehmerregelung." },
      ],
    },
    {
      id: "doc-tom-001",
      type: "TOM",
      title: "Technisch-Organisatorische Maßnahmen 2023",
      status: "In Prüfung",
      text: "Zugriffskontrolle, Verschlüsselung, Backup-Konzept und Protokollierung sind dokumentiert. Sicherheitsänderungen werden im Change Log bewertet.",
      versions: [{ version: "v3.0", date: "2023-11-05", author: "IT Security", text: "TOM-Katalog 2023." }],
    },
    {
      id: "doc-privacy-001",
      type: "Datenschutzhinweis",
      title: "Datenschutzerklärung Webseite",
      status: "Entwurf",
      text: "Die Datenschutzerklärung informiert über Verarbeitung, Rechtsgrundlagen, Empfänger und Betroffenenrechte.",
      versions: [{ version: "v4.0-draft", date: "2023-11-08", author: "DPO", text: "Webseiten-Datenschutzhinweise Entwurf." }],
    },
  ];

  let history = [];
  let documents = [];
  let proposals = [];
  let lastEvaluation = null;
  let selectedDocumentId = "";
  let selectedProposalId = "";
  let activeDocFilter = "Alle";

  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

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

    history = loadArray(STORAGE_KEY, []);
    documents = loadArray(DOCUMENTS_KEY, SAMPLE_DOCUMENTS);
    proposals = loadArray(PROPOSALS_KEY, []);
    selectedDocumentId = loadScalar(SELECTED_DOCUMENT_KEY, documents[0]?.id || "");
    selectedProposalId = loadScalar(SELECTED_PROPOSAL_KEY, proposals[0]?.id || "");

    bindEvents();
    renderAll();
    openInitialView();
    if (history.length === 0) loadSampleData(true);
  }

  function bindEvents() {
    $$(".nav-item[data-view]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view, true)));
    bindViewShortcuts();

    $("evaluateBtn").addEventListener("click", evaluateCurrentForm);
    $("saveBtn").addEventListener("click", saveLastEvaluation);
    $("createProposalBtn").addEventListener("click", createProposalFromEvaluation);
    $("resetFormBtn").addEventListener("click", resetForm);
    $("loadSamplesBtn").addEventListener("click", () => loadSampleData(false));
    $("csvUpload").addEventListener("change", importCsvFile);
    $("exportJsonBtn").addEventListener("click", exportJson);
    $("exportCsvBtn").addEventListener("click", exportCsv);
    $("clearDataBtn").addEventListener("click", clearLocalData);
    bindOptionalClick("topExportJsonBtn", exportJson);
    bindOptionalClick("topLoadSamplesBtn", () => loadSampleData(false));
    bindOptionalClick("topClearDataBtn", clearLocalData);
    $("applyEmailTextBtn").addEventListener("click", applyEmailText);
    $("emlUpload").addEventListener("change", importEmlFile);

    $("documentSearch").addEventListener("input", renderDocuments);
    $("documentImport").addEventListener("change", importDocumentFile);
    $("documentsLoadSamplesBtn").addEventListener("click", loadSampleDocuments);
    $("documentsExportBtn").addEventListener("click", exportDocuments);
    $$("#documentFilters [data-doc-filter]").forEach((button) => button.addEventListener("click", () => setDocumentFilter(button.dataset.docFilter)));

    $("externalBaseDocument").addEventListener("change", (event) => {
      selectedDocumentId = event.target.value;
      persistScalar(SELECTED_DOCUMENT_KEY, selectedDocumentId);
      renderVersionSelect();
    });
    $("externalTextUpload").addEventListener("change", importExternalTextFile);
    $("runExternalAnalysisBtn").addEventListener("click", runExternalAnalysis);
    $("versionDocumentSelect").addEventListener("change", (event) => {
      selectedDocumentId = event.target.value;
      persistScalar(SELECTED_DOCUMENT_KEY, selectedDocumentId);
      renderVersions();
      renderExternalSelect();
    });
  }

  function bindViewShortcuts() {
    $$("[data-view-shortcut]").forEach((button) => {
      button.onclick = () => showView(button.dataset.viewShortcut, true);
    });
  }

  function openInitialView() {
    const requested = (window.location.hash || "").replace(/^#/, "");
    showView(requested || "dashboard", false);
  }

  function showView(viewName, updateHash) {
    const safeView = $(`view-${viewName}`) ? viewName : "dashboard";
    $$(".app-view").forEach((view) => view.classList.toggle("active", view.id === `view-${safeView}`));
    $$(".nav-item[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === safeView));
    if (updateHash) historyReplaceHash(safeView);
    document.querySelector(".main-canvas")?.scrollTo({ top: 0, behavior: "instant" });
  }

  function historyReplaceHash(viewName) {
    if (window.history?.replaceState) window.history.replaceState(null, "", `#${viewName}`);
    else window.location.hash = viewName;
  }

  function renderAll() {
    renderDashboardStats();
    renderDocuments();
    renderExternalSelect();
    renderProposals();
    renderVersions();
    renderHistory();
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

  function loadArray(key, fallback) {
    if (!isLocalStorageAvailable()) return clone(fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch (error) {
      return clone(fallback);
    }
  }

  function loadScalar(key, fallback) {
    if (!isLocalStorageAvailable()) return fallback;
    return localStorage.getItem(key) || fallback;
  }

  function persistHistory() {
    persistArray(STORAGE_KEY, history);
  }

  function persistDocuments() {
    persistArray(DOCUMENTS_KEY, documents);
  }

  function persistProposals() {
    persistArray(PROPOSALS_KEY, proposals);
  }

  function persistArray(key, value) {
    if (isLocalStorageAvailable()) localStorage.setItem(key, JSON.stringify(value));
  }

  function persistScalar(key, value) {
    if (isLocalStorageAvailable()) localStorage.setItem(key, value);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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
      if (element) element.value = data[field] || "";
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
    if (change.date && Number.isNaN(Date.parse(`${change.date}T00:00:00`))) errors.push("Pflichtfeld 'date' enthält kein gültiges Datum.");
    ["security_change", "personal_data", "customers_affected", "external_parties"].forEach((field) => {
      if (change[field] && !YES_NO_UNKNOWN.includes(change[field])) errors.push(`Feld '${field}' muss Ja, Nein oder Unklar sein.`);
    });
    if (change.number_of_customers) {
      const number = Number(change.number_of_customers);
      if (!Number.isFinite(number) || number < 0) errors.push("Feld 'number_of_customers' muss eine nicht-negative Zahl sein.");
    }
    return errors;
  }

  function evaluateCurrentForm() {
    const change = normalizeChange(getFormData());
    const errors = validateChange(change);
    if (errors.length > 0) {
      lastEvaluation = null;
      $("saveBtn").disabled = true;
      $("createProposalBtn").disabled = true;
      showMessage("validationErrors", errors.join("<br>"), "danger");
      renderEmptyResult("Bitte korrigiere die Validierungsfehler und bewerte erneut.");
      return;
    }
    hideMessage("validationErrors");
    lastEvaluation = { ...change, ...evaluateChange(change) };
    renderResult(lastEvaluation);
    $("saveBtn").disabled = false;
    $("createProposalBtn").disabled = false;
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
    if (change.old_text && change.new_text && change.old_text === change.new_text) warnings.push("Alter und neuer Text sind identisch; keine Textänderung erkannt.");

    const impact = score === 3 ? "High" : score === 2 ? "Medium" : "Low";
    const avv = isAvvAffected(change);
    const tom = isTomAffected(change);
    const customerInfo = impact === "High" && change.customers_affected === "Ja";
    const affectedDocs = ["Änderungshistorie"];
    if (avv) affectedDocs.push("AVV");
    if (tom) affectedDocs.push("TOM");
    if (customerInfo) affectedDocs.push("Kundeninformation");
    if (change.change_type === "Datenschutzvorfall / Sicherheitsereignis") affectedDocs.push("Incident-Dokumentation");
    const measures = deriveMeasures(change, affectedDocs, impact, customerInfo);
    return {
      impact_level: impact,
      gdpr_relevance: impact === "Low" ? "Keine direkte DSGVO-Relevanz" : "DSGVO-relevant",
      affected_documents: affectedDocs,
      measures,
      customer_information_required: customerInfo,
      manual_review_required: impact !== "Low" || warnings.length > 0,
      summary: `${change.change_type} wurde als ${impact} bewertet. Betroffene Dokumente: ${affectedDocs.join(", ")}.`,
      warnings,
    };
  }

  function isAvvAffected(change) {
    return AVV_CHANGE_TYPES.has(change.change_type) || (change.external_parties === "Ja" && change.personal_data === "Ja");
  }

  function isTomAffected(change) {
    return change.security_change === "Ja" || TOM_CHANGE_TYPES.has(change.change_type);
  }

  function deriveMeasures(change, affectedDocs, impact, customerInfo) {
    const measures = [];
    if (affectedDocs.includes("AVV")) {
      measures.push("AVV prüfen", "AVV aktualisieren");
      if (["Neuer Dienstleister", "Wechsel Dienstleister"].includes(change.change_type)) measures.push("AVV neu abschließen");
      if (change.change_type === "Neuer Subunternehmer") measures.push("Subunternehmerliste prüfen");
      if (change.personal_data === "Ja") measures.push("Datenarten aktualisieren");
    }
    if (affectedDocs.includes("TOM")) {
      measures.push("Zugriffskontrolle prüfen");
      if (["Rechte-/Rollenkonzept geändert", "Datenschutzvorfall / Sicherheitsereignis"].includes(change.change_type)) measures.push("Zugangskontrolle prüfen");
      if (change.change_type === "Verschlüsselung geändert") measures.push("Verschlüsselung prüfen");
      if (change.change_type === "Backup geändert") measures.push("Backup-Konzept prüfen");
      if (change.change_type === "Infrastrukturänderung") measures.push("Netzwerk-/Firewallregel prüfen");
      if (change.change_type === "Datenschutzvorfall / Sicherheitsereignis") measures.push("Protokollierung prüfen");
    }
    measures.push(customerInfo ? "Kundeninformation vorbereiten" : "keine Kundeninfo nötig");
    if (["Medium", "High"].includes(impact)) measures.push("interne Info vorbereiten");
    if (impact === "Medium") measures.push("manuelle Prüfung durchführen");
    if (change.email_subject || change.email_sender) measures.push("Anhang prüfen");
    return [...new Set(measures)];
  }

  function saveLastEvaluation() {
    if (!lastEvaluation) return;
    history.push({ ...lastEvaluation, saved_at: new Date().toISOString(), status: "Gespeichert", action: "Bewertung" });
    persistHistory();
    renderAll();
    $("saveBtn").disabled = true;
    renderResult(lastEvaluation, "Änderung wurde lokal im Browser gespeichert.");
  }

  function renderResult(result, savedMessage = "") {
    const levelClass = result.impact_level.toLowerCase();
    const guidance = result.impact_level === "High" ? "Hohe Relevanz: AVV/TOM und ggf. Kundeninformation prüfen." : result.impact_level === "Medium" ? "Manuelle Prüfung erforderlich." : "Low: nur dokumentieren.";
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

  function createProposalFromEvaluation() {
    if (!lastEvaluation) return;
    const targetDoc = findBestDocument(lastEvaluation.affected_documents);
    const proposal = {
      id: `PROP-${Date.now()}`,
      title: `${lastEvaluation.change_type}: ${targetDoc.title}`,
      source: "Interne Änderung",
      documentId: targetDoc.id,
      impact_level: lastEvaluation.impact_level,
      status: "Offen",
      created_at: new Date().toISOString(),
      reason: lastEvaluation.summary,
      text: buildProposalText(lastEvaluation, targetDoc),
      evaluation: lastEvaluation,
    };
    proposals.unshift(proposal);
    selectedProposalId = proposal.id;
    persistScalar(SELECTED_PROPOSAL_KEY, selectedProposalId);
    persistProposals();
    renderAll();
    showView("proposals", true);
  }

  function buildProposalText(evaluation, doc) {
    return `${doc.text}\n\nÄnderungsvorschlag (${evaluation.change_id}): ${evaluation.measures.join(", ")}. Bewertung: ${evaluation.impact_level}. ${evaluation.description}`;
  }

  function findBestDocument(affectedDocs) {
    const preferredType = affectedDocs.includes("AVV") ? "AVV" : affectedDocs.includes("TOM") ? "TOM" : affectedDocs.includes("Kundeninformation") ? "Kundeninformation" : "Datenschutzhinweis";
    return documents.find((doc) => doc.type === preferredType) || documents[0] || SAMPLE_DOCUMENTS[0];
  }

  function renderDashboardStats() {
    const totals = history.reduce((acc, entry) => {
      const level = String(entry.impact_level || "").toLowerCase();
      if (level === "high") acc.high += 1;
      if (level === "medium") acc.medium += 1;
      if (level === "low") acc.low += 1;
      const timestamp = entry.saved_at || entry.date;
      if (timestamp && (!acc.lastUpdate || String(timestamp) > String(acc.lastUpdate))) acc.lastUpdate = timestamp;
      return acc;
    }, { low: 0, medium: 0, high: 0, lastUpdate: "" });
    setText("statDocuments", documents.length);
    setText("statOpenReviews", proposals.filter((proposal) => proposal.status === "Offen").length);
    setText("statHighImpact", totals.high);
    setText("statLastUpdate", formatStatDate(totals.lastUpdate));
    setText("statImpactSplit", `Low: ${totals.low} · Medium: ${totals.medium} · High: ${totals.high}`);
    setText("dashLowPill", `Low ${totals.low}`);
    setText("dashMediumPill", `Medium ${totals.medium}`);
    setText("dashHighPill", `High ${totals.high}`);
    renderDashboardActivity();
  }

  function renderDashboardActivity() {
    const target = $("dashboardActivityList");
    const activities = [...history].slice(-5).reverse();
    if (!activities.length) {
      target.innerHTML = `<div class="empty-state">Noch keine Aktivitäten. Erfasse eine Änderung oder lade Beispieldaten.</div>`;
      return;
    }
    target.innerHTML = activities.map((entry) => `
      <article class="activity-item">
        <span class="impact-badge impact-${escapeHtml(String(entry.impact_level || "Low").toLowerCase())}">${escapeHtml(entry.impact_level || "Low")}</span>
        <div><strong>${escapeHtml(entry.change_id || "Änderung")}</strong><p>${escapeHtml(entry.summary || entry.description || "Gespeicherte Bewertung")}</p></div>
        <small>${escapeHtml(formatStatDate(entry.saved_at || entry.date))}</small>
      </article>
    `).join("");
  }

  function renderDocuments() {
    const query = String($("documentSearch")?.value || "").toLowerCase();
    const rows = documents.filter((doc) => (activeDocFilter === "Alle" || doc.type === activeDocFilter) && `${doc.title} ${doc.type} ${doc.status}`.toLowerCase().includes(query));
    const thead = document.querySelector("#documentTable thead");
    const tbody = document.querySelector("#documentTable tbody");
    thead.innerHTML = "<tr><th>Typ</th><th>Titel</th><th>Version</th><th>Zuletzt geändert</th><th>Status</th><th>Aktion</th></tr>";
    tbody.innerHTML = rows.length ? rows.map((doc) => {
      const latest = latestVersion(doc);
      return `<tr class="${doc.id === selectedDocumentId ? "selected-row" : ""}"><td>${escapeHtml(doc.type)}</td><td>${escapeHtml(doc.title)}</td><td>${escapeHtml(latest.version)}</td><td>${escapeHtml(formatStatDate(latest.date))}</td><td>${escapeHtml(doc.status)}</td><td><button class="secondary slim" type="button" data-select-doc="${escapeHtml(doc.id)}">Details</button></td></tr>`;
    }).join("") : `<tr><td colspan="6">Keine Dokumente gefunden.</td></tr>`;
    $$('[data-select-doc]').forEach((button) => button.addEventListener("click", () => selectDocument(button.dataset.selectDoc)));
    renderDocumentDetail();
    renderExternalSelect();
    renderVersionSelect();
    renderDashboardStats();
  }

  function selectDocument(id) {
    selectedDocumentId = id;
    persistScalar(SELECTED_DOCUMENT_KEY, selectedDocumentId);
    renderDocuments();
    renderVersions();
  }

  function renderDocumentDetail() {
    const doc = documents.find((item) => item.id === selectedDocumentId) || documents[0];
    if (!doc) {
      $("documentDetail").innerHTML = `<div class="empty-state">Keine Dokumente vorhanden.</div>`;
      return;
    }
    const latest = latestVersion(doc);
    $("documentDetail").innerHTML = `
      <p class="panel-kicker">Dokumentdetails</p><h3>${escapeHtml(doc.title)}</h3>
      <div class="meta-list"><span>Typ</span><strong>${escapeHtml(doc.type)}</strong><span>Status</span><strong>${escapeHtml(doc.status)}</strong><span>Aktuelle Version</span><strong>${escapeHtml(latest.version)}</strong></div>
      <p>${escapeHtml(doc.text)}</p>
      <div class="button-row"><button class="secondary" type="button" data-view-shortcut="versions">Versionen ansehen</button></div>
    `;
    bindViewShortcuts();
  }

  function setDocumentFilter(filter) {
    activeDocFilter = filter;
    $$("#documentFilters [data-doc-filter]").forEach((button) => button.classList.toggle("active", button.dataset.docFilter === filter));
    renderDocuments();
  }

  function importDocumentFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      documents.unshift({ id: `doc-${Date.now()}`, type: guessDocumentType(file.name, text), title: file.name.replace(/\.[^.]+$/, ""), status: "Importiert", text, versions: [{ version: "v1.0", date: new Date().toISOString(), author: "Import", text }] });
      selectedDocumentId = documents[0].id;
      persistDocuments();
      persistScalar(SELECTED_DOCUMENT_KEY, selectedDocumentId);
      renderAll();
      event.target.value = "";
    };
    reader.readAsText(file, "utf-8");
  }

  function guessDocumentType(name, text) {
    const combined = `${name} ${text}`.toLowerCase();
    if (combined.includes("tom") || combined.includes("technisch")) return "TOM";
    if (combined.includes("avv") || combined.includes("auftragsverarbeitung")) return "AVV";
    if (combined.includes("kunde")) return "Kundeninformation";
    return "Datenschutzhinweis";
  }

  function loadSampleDocuments() {
    documents = clone(SAMPLE_DOCUMENTS);
    selectedDocumentId = documents[0]?.id || "";
    persistDocuments();
    persistScalar(SELECTED_DOCUMENT_KEY, selectedDocumentId);
    renderAll();
  }

  function exportDocuments() {
    downloadFile("dsgvo-document-library.json", JSON.stringify(documents, null, 2), "application/json");
  }

  function renderExternalSelect() {
    const select = $("externalBaseDocument");
    select.innerHTML = documents.map((doc) => `<option value="${escapeHtml(doc.id)}">${escapeHtml(doc.title)} (${escapeHtml(doc.type)})</option>`).join("");
    if (documents.some((doc) => doc.id === selectedDocumentId)) select.value = selectedDocumentId;
  }

  function importExternalTextFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      $("externalNewText").value = String(reader.result || "");
      event.target.value = "";
    };
    reader.readAsText(file, "utf-8");
  }

  function runExternalAnalysis() {
    const doc = documents.find((item) => item.id === $("externalBaseDocument").value) || documents[0];
    const newText = $("externalNewText").value.trim();
    if (!doc || !newText) {
      $("externalDiffResult").className = "diff-box empty-state";
      $("externalDiffResult").textContent = "Bitte Bestandsdokument und neuen Text angeben.";
      return;
    }
    const keywords = extractKeywords(newText);
    const change = normalizeChange({
      change_id: `EXT-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      change_type: keywords.includes("Subunternehmer") ? "Neuer Subunternehmer" : keywords.includes("Zugriff") ? "Rechte-/Rollenkonzept geändert" : "Sonstiges / Unklar",
      description: `Externe Analyse für ${doc.title}`,
      security_change: keywords.includes("Zugriff") || keywords.includes("Verschlüsselung") ? "Ja" : "Unklar",
      affected_systems: doc.title,
      personal_data: keywords.includes("Kundendaten") || keywords.includes("personenbezogene Daten") ? "Ja" : "Unklar",
      customers_affected: keywords.includes("Kundendaten") ? "Ja" : "Unklar",
      external_parties: keywords.includes("Subunternehmer") || keywords.includes("Drittland") ? "Ja" : "Unklar",
      source: "Externe Analyse",
      old_text: doc.text,
      new_text: newText,
    });
    const evaluation = { ...change, ...evaluateChange(change) };
    $("externalImpactBadge").className = `impact-badge impact-${evaluation.impact_level.toLowerCase()}`;
    $("externalImpactBadge").textContent = evaluation.impact_level;
    $("externalKeywordChips").innerHTML = renderChipList(keywords.length ? keywords : ["keine Schlüsselbegriffe erkannt"]);
    $("externalDiffResult").className = "diff-box";
    $("externalDiffResult").innerHTML = renderDiff(doc.text, newText);
    proposals.unshift({ id: `PROP-${Date.now()}`, title: `Externe Analyse: ${doc.title}`, source: "Externe Analyse", documentId: doc.id, impact_level: evaluation.impact_level, status: "Offen", created_at: new Date().toISOString(), reason: evaluation.summary, text: newText, evaluation });
    selectedProposalId = proposals[0].id;
    persistProposals();
    persistScalar(SELECTED_PROPOSAL_KEY, selectedProposalId);
    renderProposals();
    renderDashboardStats();
  }

  function extractKeywords(text) {
    const checks = ["Subunternehmer", "Drittland", "Kundendaten", "Zugriff", "Verschlüsselung", "personenbezogene Daten", "USA", "SCC", "TIA"];
    const lower = text.toLowerCase();
    return checks.filter((word) => lower.includes(word.toLowerCase()));
  }

  function renderDiff(oldText, newText) {
    const oldWords = new Set(oldText.split(/\s+/).map((word) => word.toLowerCase()).filter(Boolean));
    const newWords = newText.split(/\s+/).filter(Boolean);
    const highlighted = newWords.slice(0, 180).map((word) => oldWords.has(word.toLowerCase()) ? escapeHtml(word) : `<mark>${escapeHtml(word)}</mark>`).join(" ");
    return `<p><strong>Hinzugefügte/abweichende Begriffe sind markiert:</strong></p><p>${highlighted}${newWords.length > 180 ? " …" : ""}</p>`;
  }

  function renderProposals() {
    const openCount = proposals.filter((proposal) => proposal.status === "Offen").length;
    setText("proposalCount", `${openCount} offen`);
    const list = $("proposalList");
    list.innerHTML = proposals.length ? proposals.map((proposal) => `
      <button class="proposal-item ${proposal.id === selectedProposalId ? "active" : ""}" type="button" data-proposal-id="${escapeHtml(proposal.id)}">
        <span class="impact-badge impact-${escapeHtml(proposal.impact_level.toLowerCase())}">${escapeHtml(proposal.impact_level)}</span>
        <strong>${escapeHtml(proposal.title)}</strong>
        <small>${escapeHtml(proposal.source)} · ${escapeHtml(proposal.status)}</small>
      </button>
    `).join("") : `<div class="empty-state">Keine Vorschläge vorhanden. Erzeuge einen Vorschlag aus der internen Änderung oder externen Analyse.</div>`;
    $$('[data-proposal-id]').forEach((button) => button.addEventListener("click", () => selectProposal(button.dataset.proposalId)));
    renderProposalDetail();
  }

  function selectProposal(id) {
    selectedProposalId = id;
    persistScalar(SELECTED_PROPOSAL_KEY, selectedProposalId);
    renderProposals();
  }

  function renderProposalDetail() {
    const proposal = proposals.find((item) => item.id === selectedProposalId) || proposals[0];
    if (!proposal) {
      $("proposalDetail").className = "empty-state";
      $("proposalDetail").textContent = "Wähle einen Vorschlag aus.";
      return;
    }
    $("proposalDetail").className = "";
    $("proposalDetail").innerHTML = `
      <p class="panel-kicker">Detailkarte</p><h3>${escapeHtml(proposal.title)}</h3>
      <p><strong>Begründung:</strong> ${escapeHtml(proposal.reason)}</p>
      <label>Vorgeschlagener Text<textarea id="proposalEditText" rows="12">${escapeHtml(proposal.text)}</textarea></label>
      <div class="alert warning"><strong>Hinweis:</strong> Änderungen werden erst nach Bestätigung übernommen.</div>
      <div class="button-row"><button id="acceptProposalBtn" type="button">Änderung übernehmen</button><button id="saveReviewNoteBtn" class="secondary" type="button">Nur als Prüfhinweis speichern</button><button id="rejectProposalBtn" class="danger-button" type="button">Verwerfen</button></div>
    `;
    $("acceptProposalBtn").addEventListener("click", acceptProposal);
    $("saveReviewNoteBtn").addEventListener("click", saveProposalReviewNote);
    $("rejectProposalBtn").addEventListener("click", rejectProposal);
  }

  function acceptProposal() {
    const proposal = proposals.find((item) => item.id === selectedProposalId);
    if (!proposal) return;
    const doc = documents.find((item) => item.id === proposal.documentId) || documents[0];
    const text = $("proposalEditText").value;
    const nextVersion = `v${(doc.versions?.length || 0) + 1}.0`;
    doc.text = text;
    doc.status = "Aktualisiert";
    doc.versions = [...(doc.versions || []), { version: nextVersion, date: new Date().toISOString(), author: "DPO Workspace", text, proposalId: proposal.id }];
    proposal.text = text;
    proposal.status = "Übernommen";
    history.push({ ...(proposal.evaluation || {}), change_id: proposal.id, date: new Date().toISOString().slice(0, 10), source: proposal.source, affected_systems: doc.title, impact_level: proposal.impact_level, measures: ["Änderung übernommen", "Neue Dokumentversion erzeugt"], manual_review_required: false, summary: `Vorschlag ${proposal.id} übernommen und ${nextVersion} für ${doc.title} erzeugt.`, saved_at: new Date().toISOString(), status: "Umgesetzt", action: "Übernehmen" });
    persistDocuments();
    persistProposals();
    persistHistory();
    renderAll();
    showView("versions", true);
  }

  function saveProposalReviewNote() {
    const proposal = proposals.find((item) => item.id === selectedProposalId);
    if (!proposal) return;
    proposal.text = $("proposalEditText").value;
    proposal.status = "Prüfhinweis";
    history.push({ ...(proposal.evaluation || {}), change_id: proposal.id, date: new Date().toISOString().slice(0, 10), source: proposal.source, affected_systems: documents.find((doc) => doc.id === proposal.documentId)?.title || "Dokument", impact_level: proposal.impact_level, measures: ["Als Prüfhinweis gespeichert"], manual_review_required: true, summary: `Vorschlag ${proposal.id} als Prüfhinweis gespeichert.`, saved_at: new Date().toISOString(), status: "Offen", action: "Prüfhinweis" });
    persistProposals();
    persistHistory();
    renderAll();
  }

  function rejectProposal() {
    const proposal = proposals.find((item) => item.id === selectedProposalId);
    if (!proposal) return;
    proposal.status = "Verworfen";
    persistProposals();
    renderAll();
  }

  function renderVersions() {
    renderVersionSelect();
    const doc = documents.find((item) => item.id === selectedDocumentId) || documents[0];
    if (!doc) return;
    $("versionTimeline").innerHTML = [...(doc.versions || [])].reverse().map((version) => `
      <article class="timeline-item"><span></span><div><strong>${escapeHtml(version.version)}</strong><p>${escapeHtml(formatStatDate(version.date))} · ${escapeHtml(version.author || "Unbekannt")}</p><small>${escapeHtml(version.text)}</small></div></article>
    `).join("");
    $("versionDetail").innerHTML = `<p class="panel-kicker">Ausgewähltes Dokument</p><h3>${escapeHtml(doc.title)}</h3><p>${escapeHtml(doc.text)}</p><div class="meta-list"><span>Versionen</span><strong>${doc.versions?.length || 0}</strong><span>Status</span><strong>${escapeHtml(doc.status)}</strong></div>`;
  }

  function renderVersionSelect() {
    const select = $("versionDocumentSelect");
    select.innerHTML = documents.map((doc) => `<option value="${escapeHtml(doc.id)}">${escapeHtml(doc.title)}</option>`).join("");
    if (documents.some((doc) => doc.id === selectedDocumentId)) select.value = selectedDocumentId;
  }

  function latestVersion(doc) {
    const versions = doc.versions || [];
    return versions[versions.length - 1] || { version: "v1.0", date: "", author: "", text: doc.text || "" };
  }

  function renderHistory() {
    renderDashboardStats();
    const thead = document.querySelector("#historyTable thead");
    const tbody = document.querySelector("#historyTable tbody");
    thead.innerHTML = `<tr>${["Datum", "Quelle", "Dokument", "Impact", "Maßnahmen", "Status", "Aktion"].map((column) => `<th>${column}</th>`).join("")}</tr>`;
    if (history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">Noch keine Änderungen gespeichert. Nutze das Formular oder lade Beispieldaten.</td></tr>`;
      return;
    }
    tbody.innerHTML = [...history].reverse().map((entry, index) => `<tr>${TABLE_COLUMNS.map((column) => `<td>${formatTableValue(column, entry[column], entry, index)}</td>`).join("")}</tr>`).join("");
    $$('[data-load-history-index]').forEach((button) => button.addEventListener("click", () => loadHistoryEntry(Number(button.dataset.loadHistoryIndex))));
    bindViewShortcuts();
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

  function formatTableValue(column, value, entry = {}, index = 0) {
    if (column === "impact_level") return `<span class="table-impact impact-${escapeHtml(String(value || "Low").toLowerCase())}">${escapeHtml(value || "Low")}</span>`;
    if (column === "manual_review_required") return escapeHtml(entry.status || (value ? "Offen" : "Umgesetzt"));
    if (column === "change_id") return `<button class="secondary slim" type="button" data-load-history-index="${index}">Details</button>`;
    if (Array.isArray(value)) return escapeHtml(value.join("; "));
    if (typeof value === "boolean") return value ? "Ja" : "Nein";
    return escapeHtml(value ?? "");
  }

  function loadHistoryEntry(reversedIndex) {
    const entry = [...history].reverse()[reversedIndex];
    if (!entry) return;
    setFormData(entry);
    lastEvaluation = entry;
    renderResult(entry, "Eintrag aus der Änderungshistorie geladen.");
    $("saveBtn").disabled = true;
    $("createProposalBtn").disabled = false;
    showView("internal-change", true);
  }

  function loadAllSamples() {
    loadSampleDocuments();
    loadSampleData(false);
  }

  async function loadSampleData(isAutomatic = false) {
    hideMessage("importErrors");
    try {
      const response = await fetch("data/sample_changes.csv", { cache: "no-store" });
      if (!response.ok) throw new Error("Beispieldatei konnte nicht geladen werden.");
      const text = await response.text();
      importRows(parseCsv(text), "CSV-Beispieldatei");
    } catch (error) {
      const evaluated = FALLBACK_SAMPLE_CHANGES.map((change) => ({ ...change, ...evaluateChange(change), saved_at: new Date().toISOString(), status: "Gespeichert", action: "Beispieldaten" }));
      history = [...history, ...evaluated];
      persistHistory();
      renderAll();
      if (!isAutomatic) showMessage("importErrors", "Browser konnte data/sample_changes.csv nicht direkt laden. Fallback-Beispieldaten aus script.js wurden geladen.", "warning");
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
      imported.push({ ...change, ...evaluateChange(change), saved_at: new Date().toISOString(), status: "Gespeichert", action: "CSV Import" });
    });
    if (imported.length) {
      history = [...history, ...imported];
      persistHistory();
      renderAll();
    }
    showMessage("importErrors", `${imported.length} Einträge aus ${escapeHtml(sourceName)} importiert.${errors.length ? " Fehler: " + errors.map(escapeHtml).join(" | ") : ""}`, "warning");
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
    downloadFile("dsgvo-change-history.csv", toCsv(history, [...INPUT_FIELDS, ...OUTPUT_FIELDS, "saved_at", "status", "action"]), "text/csv;charset=utf-8");
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
    if (!confirm("Alle lokalen Daten wirklich löschen? Exportiere die Daten vorher, wenn du sie behalten möchtest.")) return;
    history = [];
    documents = clone(SAMPLE_DOCUMENTS);
    proposals = [];
    selectedDocumentId = documents[0]?.id || "";
    selectedProposalId = "";
    if (isLocalStorageAvailable()) {
      [STORAGE_KEY, DOCUMENTS_KEY, PROPOSALS_KEY, SELECTED_DOCUMENT_KEY, SELECTED_PROPOSAL_KEY].forEach((key) => localStorage.removeItem(key));
    }
    renderAll();
    renderEmptyResult("Lokale Daten wurden geleert.");
  }

  function resetForm() {
    $("changeForm").reset();
    populateSelect("security_change", YES_NO_UNKNOWN, "Nein");
    populateSelect("personal_data", YES_NO_UNKNOWN, "Nein");
    populateSelect("customers_affected", YES_NO_UNKNOWN, "Nein");
    populateSelect("external_parties", YES_NO_UNKNOWN, "Nein");
    $("date").value = new Date().toISOString().slice(0, 10);
    $("source").value = "Manuelle Eingabe";
    lastEvaluation = null;
    $("saveBtn").disabled = true;
    $("createProposalBtn").disabled = true;
    hideMessage("validationErrors");
    renderEmptyResult("Noch keine Bewertung. Fülle das Formular aus und klicke auf „Änderung bewerten“.");
  }

  function applyEmailText() {
    const text = $("emailText").value.trim();
    if (!text) return;
    applyEmailData(parseEmlText(text), text);
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
    return { sender: getHeader("From") || getHeader("Absender"), subject: getHeader("Subject") || getHeader("Betreff"), date: getHeader("Date") || getHeader("Datum"), body };
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
    showView("internal-change", true);
  }

  function renderChipList(items) {
    return `<ul class="chip-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
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

  function showMessage(id, html, type) {
    const element = $(id);
    if (!element) return;
    element.className = `alert ${type}`;
    element.innerHTML = html;
  }

  function hideMessage(id) {
    const element = $(id);
    if (!element) return;
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
