(() => {
  "use strict";

  const HISTORY_KEY = "dsgvo.history.v3";
  const DOCUMENTS_KEY = "dsgvo.documents.v3";
  const VERSIONS_KEY = "dsgvo.versions.v3";
  const PROPOSALS_KEY = "dsgvo.proposals.v3";

  const REQUIRED_FIELDS = ["change_id", "date", "change_type", "description", "security_change", "affected_systems", "personal_data", "customers_affected", "external_parties"];
  const INPUT_FIELDS = [...REQUIRED_FIELDS, "source", "source_url", "number_of_customers", "old_text", "new_text", "notes", "email_sender", "email_subject", "email_received_at"];
  const OUTPUT_FIELDS = ["impact_level", "gdpr_relevance", "affected_documents", "measures", "customer_information_required", "manual_review_required", "summary", "warnings"];
  const HISTORY_COLUMNS = ["entry_type", "change_id", "date", "change_type", "impact_level", "target_document_id", "old_version", "new_version", "affected_documents", "measures", "summary", "status"];
  const DOCUMENT_COLUMNS = ["document_id", "document_type", "title", "version", "updated_at", "hash"];
  const DOCUMENT_TYPES = ["AVV", "TOM", "Datenschutzhinweis", "Änderungshistorie", "Kundeninformation", "Incident-Dokumentation", "Nutzungsbedingungen", "Dienstleister-AVV", "Sonstiges"];
  const KNOWN_CHANGE_TYPES = ["Neuer Dienstleister", "Wechsel Dienstleister", "Neuer Subunternehmer", "Freelancer mit Zugriff", "Software-Update ohne Datenbezug", "Software-Update mit Datenbezug", "API-Änderung", "API entfernt", "Infrastrukturänderung", "Backup geändert", "Rechte-/Rollenkonzept geändert", "Verschlüsselung geändert", "Neues System", "System wird abgeschaltet", "Datenschutzvorfall / Sicherheitsereignis", "Sonstiges / Unklar"];
  const YES_NO_UNKNOWN = ["Ja", "Nein", "Unklar"];
  const HIGH_CHANGE_TYPES = new Set(["Neuer Dienstleister", "Wechsel Dienstleister", "Neuer Subunternehmer", "Freelancer mit Zugriff", "API-Änderung", "API entfernt", "Infrastrukturänderung", "Backup geändert", "Rechte-/Rollenkonzept geändert", "Verschlüsselung geändert", "Datenschutzvorfall / Sicherheitsereignis"]);
  const AVV_CHANGE_TYPES = new Set(["Neuer Dienstleister", "Wechsel Dienstleister", "Neuer Subunternehmer", "Freelancer mit Zugriff"]);
  const TOM_CHANGE_TYPES = new Set(["Backup geändert", "Rechte-/Rollenkonzept geändert", "Verschlüsselung geändert", "Infrastrukturänderung", "Datenschutzvorfall / Sicherheitsereignis"]);
  const KEYWORDS = ["Dienstleister", "Subunternehmer", "Auftragsverarbeiter", "personenbezogene Daten", "Kundendaten", "Hosting", "Cloud", "Drittland", "USA", "Zugriff", "Rollen", "Rechte", "Verschlüsselung", "Backup", "Sicherheitsvorfall", "Datenschutzvorfall", "API", "Schnittstelle", "Nutzungsbedingungen", "AVV", "TOM"];

  const FALLBACK_SAMPLE_CHANGES = [
    { change_id: "CHG-001", date: "2026-06-09", change_type: "Neuer Dienstleister", description: "Ein neuer lokaler IT-Dienstleister verarbeitet Kundendaten für das Ticketsystem.", security_change: "Nein", affected_systems: "Ticketsystem", personal_data: "Ja", customers_affected: "Ja", external_parties: "Ja", source: "Fallback-Beispieldaten", source_url: "", number_of_customers: "12", old_text: "", new_text: "", notes: "Anonymisierte Beispieldaten", email_sender: "", email_subject: "", email_received_at: "" },
    { change_id: "CHG-002", date: "2026-06-09", change_type: "Software-Update ohne Datenbezug", description: "Update einer internen Bibliothek ohne Verarbeitung personenbezogener Daten.", security_change: "Nein", affected_systems: "Build-System", personal_data: "Nein", customers_affected: "Nein", external_parties: "Nein", source: "Fallback-Beispieldaten", source_url: "", number_of_customers: "0", old_text: "", new_text: "", notes: "Low-Beispiel", email_sender: "", email_subject: "", email_received_at: "" },
    { change_id: "CHG-003", date: "2026-06-09", change_type: "API-Änderung", description: "CRM API überträgt personenbezogene Kundendaten an ein externes System.", security_change: "Ja", affected_systems: "CRM API", personal_data: "Ja", customers_affected: "Ja", external_parties: "Ja", source: "Fallback-Beispieldaten", source_url: "", number_of_customers: "5", old_text: "", new_text: "", notes: "API-Beispiel", email_sender: "", email_subject: "", email_received_at: "" },
  ];

  const SAMPLE_DOCUMENTS = [
    { document_id: "AVV-001", document_type: "AVV", title: "AVV Cloud-Dienstleister", version: "1.0", current_text: "AVV Cloud-Dienstleister\n\nGegenstand: Betrieb eines lokalen Demo-Ticketsystems.\n\nUnterauftragnehmer: Keine weiteren Unterauftragnehmer in dieser anonymisierten Beispieldatei.\n\nVerarbeitung: Es werden ausschließlich Demo-Kundendaten verarbeitet.\n\nPrüfhinweis: Änderungen an Dienstleistern oder Subunternehmern sind vor Einsatz zu dokumentieren.", source_file: "sample", created_at: "2026-06-09", updated_at: "2026-06-09" },
    { document_id: "TOM-001", document_type: "TOM", title: "TOM Basiskonzept", version: "1.0", current_text: "TOM Basiskonzept\n\nZugriffskontrolle: Rollen und Rechte werden regelmäßig geprüft.\n\nVerschlüsselung: Datenübertragungen erfolgen verschlüsselt.\n\nBackup: Backups werden regelmäßig erstellt und stichprobenartig geprüft.\n\nProtokollierung: Sicherheitsereignisse werden dokumentiert.", source_file: "sample", created_at: "2026-06-09", updated_at: "2026-06-09" },
    { document_id: "NUTZ-001", document_type: "Nutzungsbedingungen", title: "Externe Nutzungsbedingungen Dienstleister", version: "1.0", current_text: "Nutzungsbedingungen Dienstleister\n\nDer Dienst wird in der EU betrieben. Es werden keine neuen Subunternehmer eingesetzt. Supportzugriffe erfolgen nur nach Freigabe.", source_file: "sample", created_at: "2026-06-09", updated_at: "2026-06-09" },
    { document_id: "KINFO-001", document_type: "Kundeninformation", title: "Kundeninformation Datenschutzänderungen", version: "1.0", current_text: "Kundeninformation\n\nDiese Vorlage enthält allgemeine Hinweise zu technischen Änderungen. Konkrete Änderungen werden erst nach interner Prüfung ergänzt.", source_file: "sample", created_at: "2026-06-09", updated_at: "2026-06-09" },
  ];

  let history = [];
  let documents = [];
  let versions = [];
  let proposals = [];
  let lastEvaluation = null;
  let lastExternalEvaluation = null;
  let currentProposal = null;
  let activeMode = "internal";

  const $ = (id) => document.getElementById(id);
  const today = () => new Date().toISOString().slice(0, 10);

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    populateSelect("change_type", KNOWN_CHANGE_TYPES);
    ["security_change", "personal_data", "customers_affected", "external_parties"].forEach((id) => populateSelect(id, YES_NO_UNKNOWN, "Nein"));
    $("date").value = today();
    $("source").value = "Manuelle Eingabe";

    if (!isLocalStorageAvailable()) showMessage("storageWarning", "localStorage ist nicht verfügbar. Bewertungen funktionieren, aber Daten werden eventuell nicht dauerhaft gespeichert.", "warning");

    history = loadJson(HISTORY_KEY, []);
    documents = loadJson(DOCUMENTS_KEY, []);
    versions = loadJson(VERSIONS_KEY, []);
    proposals = loadJson(PROPOSALS_KEY, []);
    normalizeLoadedDocuments();
    bindEvents();
    renderAll();
    if (history.length === 0) loadSampleChanges(true);
  }

  function bindEvents() {
    document.querySelectorAll(".nav-link, .jump-button").forEach((button) => button.addEventListener("click", () => showSection(button.dataset.target)));
    $("dashboardLoadSamplesBtn").addEventListener("click", loadSampleDocuments);
    $("loadSampleDocumentsBtn").addEventListener("click", loadSampleDocuments);
    $("documentImport").addEventListener("change", importDocuments);
    $("exportDocumentsBtn").addEventListener("click", () => downloadFile("dsgvo-document-library.json", JSON.stringify({ documents, versions }, null, 2), "application/json"));
    $("documentSelect").addEventListener("change", renderDocumentDetails);
    $("documentSearch").addEventListener("input", renderDocumentTable);
    $("documentTypeFilter").addEventListener("change", renderDocumentTable);
    $("evaluateBtn").addEventListener("click", evaluateCurrentForm);
    $("saveBtn").addEventListener("click", saveLastEvaluation);
    $("resetFormBtn").addEventListener("click", resetForm);
    $("changeImport").addEventListener("change", importChangeFile);
    $("loadSamplesBtn").addEventListener("click", () => loadSampleChanges(false));
    $("csvUpload").addEventListener("change", importCsvFile);
    $("exportJsonBtn").addEventListener("click", () => downloadFile("dsgvo-change-history.json", JSON.stringify(history, null, 2), "application/json"));
    $("exportCsvBtn").addEventListener("click", exportHistoryCsv);
    $("clearDataBtn").addEventListener("click", clearLocalData);
    $("applyEmailTextBtn").addEventListener("click", applyEmailText);
    $("emlUpload").addEventListener("change", importEmlFile);
    $("compareExternalBtn").addEventListener("click", compareExternalChange);
    $("externalTextUpload").addEventListener("change", importExternalTextFile);
    $("generateProposalBtn").addEventListener("click", generateProposalFromCurrentContext);
    $("applyProposalBtn").addEventListener("click", applyCurrentProposal);
    $("saveReviewBtn").addEventListener("click", saveCurrentProposalAsReview);
    $("discardProposalBtn").addEventListener("click", discardCurrentProposal);
  }

  function renderAll() {
    renderDocumentTypeFilter();
    renderDocumentSelectors();
    renderDocumentTable();
    renderDocumentDetails();
    renderHistory();
    renderVersionTimeline();
    renderProposalList();
    renderDashboard();
    renderProposalEmpty();
  }

  function populateSelect(id, options, selectedValue = "") {
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

  function renderDashboard() {
    $("metricDocuments").textContent = String(documents.length);
    $("metricDrafts").textContent = String(proposals.filter((proposal) => proposal.status === "draft").length);
    $("metricHighImpact").textContent = String(history.filter((entry) => entry.impact_level === "High").length);
    const dates = [...history.map((entry) => entry.saved_at), ...documents.map((doc) => doc.updated_at), ...versions.map((version) => version.created_at)].filter(Boolean).sort();
    $("metricUpdated").textContent = dates.length ? formatDate(dates[dates.length - 1]) : "-";
  }

  function renderDocumentTypeFilter() {
    const filter = $("documentTypeFilter");
    const previous = filter.value;
    filter.innerHTML = '<option value="">Alle Typen</option>';
    DOCUMENT_TYPES.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      filter.appendChild(option);
    });
    filter.value = previous;
  }

  function showSection(targetId) {
    if (!targetId) return;
    document.querySelectorAll(".view-section").forEach((section) => section.classList.toggle("active-view", section.id === targetId));
    document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.target === targetId));
    if (targetId === "externalSection") activeMode = "external";
    if (targetId === "internalSection") activeMode = "internal";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function isLocalStorageAvailable() {
    try {
      localStorage.setItem("__dsgvo_test__", "1");
      localStorage.removeItem("__dsgvo_test__");
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadJson(key, fallback) {
    if (!isLocalStorageAvailable()) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveAll() {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
  }

  function normalizeLoadedDocuments() {
    documents = documents.map((doc) => ({ ...doc, hash: doc.hash || hashText(doc.current_text || "") }));
  }

  function createDocument(doc) {
    const now = today();
    const document = {
      document_id: doc.document_id || nextId("DOC", documents.length + 1),
      document_type: DOCUMENT_TYPES.includes(doc.document_type) ? doc.document_type : "Sonstiges",
      title: doc.title || "Unbenanntes Dokument",
      version: doc.version || "1.0",
      current_text: doc.current_text || doc.text || "",
      source_file: doc.source_file || "local",
      created_at: doc.created_at || now,
      updated_at: doc.updated_at || now,
    };
    document.hash = hashText(document.current_text);
    return document;
  }

  function loadSampleDocuments() {
    const existingIds = new Set(documents.map((doc) => doc.document_id));
    const additions = SAMPLE_DOCUMENTS.filter((doc) => !existingIds.has(doc.document_id)).map(createDocument);
    documents = [...documents, ...additions];
    saveAll();
    renderAll();
    showMessage("documentMessage", additions.length ? `${additions.length} Beispieldokumente geladen.` : "Beispieldokumente waren bereits vorhanden.", "warning");
  }

  function importDocuments(event) {
    const file = event.target.files[0];
    if (!file) return;
    readFile(file, (text) => {
      try {
        let imported = [];
        if (file.name.toLowerCase().endsWith(".json")) {
          const parsed = JSON.parse(text);
          imported = Array.isArray(parsed) ? parsed : (parsed.documents || []);
          if (!Array.isArray(parsed) && Array.isArray(parsed.versions)) versions = [...versions, ...parsed.versions];
        } else if (file.name.toLowerCase().endsWith(".csv")) {
          imported = parseCsv(text);
        } else {
          imported = [{ document_type: "Sonstiges", title: file.name, current_text: text, source_file: file.name }];
        }
        const created = imported.map(createDocument);
        documents = [...documents, ...created];
        saveAll();
        renderAll();
        showMessage("documentMessage", `${created.length} Dokument(e) importiert.`, "warning");
      } catch (error) {
        showMessage("documentMessage", `Dokumentimport fehlgeschlagen: ${escapeHtml(error.message)}`, "danger");
      } finally {
        event.target.value = "";
      }
    });
  }

  function renderDocumentSelectors() {
    const options = documents.length ? documents : [];
    ["documentSelect", "externalDocumentSelect", "targetDocumentSelect"].forEach((id) => {
      const select = $(id);
      const previous = select.value;
      select.innerHTML = "";
      if (!options.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Keine Dokumente vorhanden";
        select.appendChild(option);
        return;
      }
      options.forEach((doc) => {
        const option = document.createElement("option");
        option.value = doc.document_id;
        option.textContent = `${doc.document_id} · ${doc.document_type} · ${doc.title}`;
        select.appendChild(option);
      });
      if (previous && documents.some((doc) => doc.document_id === previous)) select.value = previous;
    });
  }

  function renderDocumentTable() {
    const thead = document.querySelector("#documentTable thead");
    const tbody = document.querySelector("#documentTable tbody");
    const query = normalizeText($("documentSearch").value || "");
    const type = $("documentTypeFilter").value;
    const filtered = documents.filter((doc) => {
      const matchesType = !type || doc.document_type === type;
      const haystack = normalizeText(`${doc.document_id} ${doc.document_type} ${doc.title} ${doc.current_text}`);
      return matchesType && (!query || haystack.includes(query));
    });
    thead.innerHTML = `<tr>${DOCUMENT_COLUMNS.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>`;
    tbody.innerHTML = filtered.length ? filtered.map((doc) => `<tr>${DOCUMENT_COLUMNS.map((column) => `<td>${escapeHtml(doc[column] || "")}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${DOCUMENT_COLUMNS.length}">Keine passenden Dokumente gefunden.</td></tr>`;
  }

  function renderDocumentDetails() {
    const id = $("documentSelect").value;
    const doc = documents.find((item) => item.document_id === id);
    if (!doc) {
      $("documentDetails").className = "detail-box empty-state";
      $("documentDetails").textContent = "Noch kein Dokument ausgewählt.";
      $("versionList").className = "version-list empty-state";
      $("versionList").textContent = "Noch keine Versionen vorhanden.";
      return;
    }
    $("documentDetails").className = "detail-box";
    $("documentDetails").innerHTML = `<h3>${escapeHtml(doc.title)}</h3><dl><dt>ID</dt><dd>${escapeHtml(doc.document_id)}</dd><dt>Typ</dt><dd>${escapeHtml(doc.document_type)}</dd><dt>Version</dt><dd>${escapeHtml(doc.version)}</dd><dt>Hash</dt><dd>${escapeHtml(doc.hash)}</dd><dt>Aktualisiert</dt><dd>${escapeHtml(doc.updated_at)}</dd></dl><pre>${escapeHtml(doc.current_text)}</pre>`;
    const docVersions = versions.filter((version) => version.document_id === doc.document_id).slice().reverse();
    $("versionList").className = docVersions.length ? "version-list" : "version-list empty-state";
    $("versionList").innerHTML = docVersions.length ? docVersions.map((version) => `<article class="version-card"><strong>${escapeHtml(version.old_version)} → ${escapeHtml(version.new_version)}</strong><span>${escapeHtml(version.created_at)} · ${escapeHtml(version.created_from_change_id || "")}</span><p>${escapeHtml(version.change_summary)}</p></article>`).join("") : "Noch keine bestätigten Folgeversionen. Die aktuelle Dokumentversion bleibt erhalten, bis ein Vorschlag übernommen wird.";
  }

  function renderVersionTimeline() {
    const target = $("versionTimeline");
    const sorted = versions.slice().reverse();
    target.className = sorted.length ? "timeline" : "timeline empty-state";
    target.innerHTML = sorted.length ? sorted.map((version) => `<article class="timeline-item"><div class="timeline-dot"></div><div><strong>${escapeHtml(version.document_id)} · ${escapeHtml(version.old_version)} → ${escapeHtml(version.new_version)}</strong><span>${escapeHtml(formatDate(version.created_at))} · ${escapeHtml(version.created_from_change_id || "ohne Change-ID")}</span><p>${escapeHtml(version.change_summary)}</p></div></article>`).join("") : "Noch keine bestätigten Versionen vorhanden.";
  }

  function renderProposalList() {
    const target = $("proposalList");
    const drafts = proposals.filter((proposal) => proposal.status === "draft").slice().reverse();
    target.className = drafts.length ? "version-list" : "version-list empty-state";
    target.innerHTML = drafts.length ? drafts.map((proposal) => `<article class="version-card"><strong>${escapeHtml(proposal.proposal_id)} · ${escapeHtml(proposal.proposal_type)}</strong><span>Ziel: ${escapeHtml(proposal.target_document_id)} · Quelle: ${escapeHtml(proposal.source_change_id || "")}</span><p>${escapeHtml(proposal.reason)}</p></article>`).join("") : "Noch keine offenen Entwürfe.";
  }

  function getFormData() {
    const data = {};
    INPUT_FIELDS.forEach((field) => data[field] = String(($(field) && $(field).value) || "").trim());
    return data;
  }

  function setFormData(data) {
    INPUT_FIELDS.forEach((field) => { if ($(field)) $(field).value = data[field] || ""; });
  }

  function normalizeChange(change) {
    const normalized = {};
    INPUT_FIELDS.forEach((field) => normalized[field] = String(change[field] ?? "").trim());
    return normalized;
  }

  function validateChange(change) {
    const errors = [];
    REQUIRED_FIELDS.forEach((field) => { if (!change[field]) errors.push(`Pflichtfeld '${field}' fehlt.`); });
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
    if (errors.length) {
      lastEvaluation = null;
      $("saveBtn").disabled = true;
      showMessage("validationErrors", errors.map(escapeHtml).join("<br>"), "danger");
      renderEmptyResult("Bitte korrigiere die Validierungsfehler und bewerte erneut.");
      return;
    }
    hideMessage("validationErrors");
    lastEvaluation = { ...change, ...evaluateChange(change), entry_type: "internal_change", status: "bewertet" };
    activeMode = "internal";
    renderResult(lastEvaluation);
    $("saveBtn").disabled = false;
  }

  function evaluateChange(change) {
    const warnings = [];
    let score = 1;
    const customerCount = Number(change.number_of_customers || 0);
    if (change.external_parties === "Ja" && change.personal_data === "Ja") score = Math.max(score, 3);
    if (HIGH_CHANGE_TYPES.has(change.change_type)) score = Math.max(score, 3);
    if (change.customers_affected === "Ja" && customerCount > 10) score = Math.max(score, 3);
    if ([change.security_change, change.personal_data, change.customers_affected, change.external_parties].includes("Unklar")) score = Math.max(score, 2);
    if (!KNOWN_CHANGE_TYPES.includes(change.change_type) || change.change_type === "Sonstiges / Unklar") {
      score = Math.max(score, 2);
      warnings.push("Änderungstyp ist unbekannt oder unklar; manuelle Prüfung erforderlich.");
    }
    if (change.old_text && change.new_text && hashText(change.old_text) === hashText(change.new_text)) warnings.push("Alter und neuer Text sind identisch; keine Textänderung erkannt.");
    const impact = score === 3 ? "High" : score === 2 ? "Medium" : "Low";
    const documentsAffected = affectedDocumentsForChange(change, impact);
    const customerInfo = documentsAffected.includes("Kundeninformation");
    return {
      impact_level: impact,
      gdpr_relevance: impact === "Low" ? "Keine direkte DSGVO-Relevanz" : "DSGVO-relevant",
      affected_documents: documentsAffected,
      measures: deriveMeasures(change, documentsAffected, impact),
      customer_information_required: customerInfo,
      manual_review_required: impact !== "Low" || warnings.length > 0,
      summary: `${change.change_type} wurde als ${impact} bewertet. Betroffene Dokumenttypen: ${documentsAffected.join(", ")}.`,
      warnings,
    };
  }

  function affectedDocumentsForChange(change, impact) {
    const docs = ["Änderungshistorie"];
    if (AVV_CHANGE_TYPES.has(change.change_type) || (change.external_parties === "Ja" && change.personal_data === "Ja")) docs.push("AVV");
    if (change.security_change === "Ja" || TOM_CHANGE_TYPES.has(change.change_type)) docs.push("TOM");
    if (impact === "High" && (change.customers_affected === "Ja" || Number(change.number_of_customers || 0) > 10)) docs.push("Kundeninformation");
    if (change.change_type === "Datenschutzvorfall / Sicherheitsereignis") docs.push("Incident-Dokumentation");
    return [...new Set(docs)];
  }

  function deriveMeasures(change, docs, impact, extraKeywords = []) {
    const measures = [];
    if (docs.includes("AVV")) {
      measures.push("AVV prüfen", "AVV aktualisieren");
      if (["Neuer Dienstleister", "Wechsel Dienstleister"].includes(change.change_type)) measures.push("AVV neu abschließen");
      if (change.change_type === "Neuer Subunternehmer" || extraKeywords.includes("Subunternehmer")) measures.push("Subunternehmerliste prüfen");
      if (change.personal_data === "Ja") measures.push("Datenarten aktualisieren");
    }
    if (docs.includes("TOM")) {
      measures.push("Zugriffskontrolle prüfen");
      if (["Rechte-/Rollenkonzept geändert", "Datenschutzvorfall / Sicherheitsereignis"].includes(change.change_type)) measures.push("Zugangskontrolle prüfen");
      if (change.change_type === "Verschlüsselung geändert" || extraKeywords.includes("Verschlüsselung")) measures.push("Verschlüsselung prüfen");
      if (change.change_type === "Backup geändert" || extraKeywords.includes("Backup")) measures.push("Backup-Konzept prüfen");
      if (change.change_type === "Infrastrukturänderung" || extraKeywords.includes("Cloud") || extraKeywords.includes("Hosting")) measures.push("Netzwerk-/Firewallregel prüfen");
      if (change.change_type === "Datenschutzvorfall / Sicherheitsereignis") measures.push("Protokollierung prüfen");
    }
    if (docs.includes("Kundeninformation")) measures.push("Kundeninformation vorbereiten", "Mail-Template generieren");
    else measures.push("keine Kundeninfo nötig");
    if (impact !== "Low") measures.push("interne Info vorbereiten", "manuelle Prüfung durchführen");
    return [...new Set(measures)];
  }

  function renderResult(result) {
    const levelClass = result.impact_level.toLowerCase();
    const guidance = result.impact_level === "High" ? "Hohe Relevanz: Vorschlag prüfen und ggf. Dokumentversion nach Bestätigung erstellen." : result.impact_level === "Medium" ? "Manuelle Prüfung erforderlich." : "Low: nur dokumentieren.";
    $("resultBox").className = "result-card";
    $("resultBox").innerHTML = `<span class="impact-badge impact-${levelClass}">${escapeHtml(result.impact_level)}</span><div class="result-message ${levelClass}">${escapeHtml(guidance)}</div><div><strong>Betroffene Dokumenttypen:</strong>${renderChipList(result.affected_documents)}</div><div><strong>Maßnahmen:</strong>${renderChipList(result.measures)}</div><div><strong>Kundeninformation erforderlich:</strong> ${result.customer_information_required ? "Ja" : "Nein"}</div><div><strong>Manuelle Prüfung erforderlich:</strong> ${result.manual_review_required ? "Ja" : "Nein"}</div><div><strong>Zusammenfassung:</strong> ${escapeHtml(result.summary)}</div>${result.warnings.length ? `<div class="alert warning"><strong>Warnungen:</strong><br>${result.warnings.map(escapeHtml).join("<br>")}</div>` : ""}`;
  }

  function renderEmptyResult(message) {
    $("resultBox").className = "empty-state";
    $("resultBox").textContent = message;
  }

  function saveLastEvaluation() {
    if (!lastEvaluation) return;
    history.push({ ...lastEvaluation, saved_at: new Date().toISOString() });
    saveAll();
    renderHistory();
    renderDashboard();
    $("saveBtn").disabled = true;
  }

  function generateProposalFromCurrentContext() {
    const target = documents.find((doc) => doc.document_id === $("targetDocumentSelect").value);
    const source = activeMode === "external" && lastExternalEvaluation ? lastExternalEvaluation : lastEvaluation;
    if (!target || !source) {
      showMessage("proposalMessage", "Bitte zuerst eine Änderung bewerten oder eine externe Änderung vergleichen und ein Zieldokument auswählen.", "danger");
      return;
    }
    currentProposal = buildProposal(source, target, activeMode);
    proposals.push(currentProposal);
    saveAll();
    renderProposal(currentProposal);
    renderProposalList();
    renderDashboard();
  }

  function buildProposal(source, target, mode) {
    const proposalId = nextId("PROP", proposals.length + 1);
    const targetType = target.document_type;
    const warnings = [];
    let proposalType = "manual_review_only";
    let reason = "Keine sichere automatische Änderung erkannt; Prüfhinweis vorgeschlagen.";
    let proposedText = `\n\n[Prüfhinweis ${today()}]\n${source.summary}\nMaßnahmen: ${(source.measures || []).join("; ")}\n`;

    if ((targetType === "AVV" || targetType === "Dienstleister-AVV") && (source.affected_documents || []).includes("AVV")) {
      proposalType = "append_section";
      reason = "AVV-relevante Änderung erkannt, z. B. Dienstleister/Subunternehmer oder externe Verarbeitung personenbezogener Daten.";
      proposedText = `\n\n[AVV-Ergänzung ${today()}]\nÄnderung: ${source.description || source.summary}\nBetroffene Systeme: ${source.affected_systems || "zu prüfen"}\nPersonenbezogene Daten: ${source.personal_data || "zu prüfen"}\nExterne Beteiligte: ${source.external_parties || "zu prüfen"}\nPrüfmaßnahmen: AVV prüfen; Subunternehmerliste prüfen; Kundeninformation prüfen.\n`;
    } else if (targetType === "TOM" && (source.affected_documents || []).includes("TOM")) {
      proposalType = source.impact_level === "High" ? "append_section" : "add_note";
      reason = "TOM-relevante Änderung erkannt, z. B. Backup, Rollen/Rechte, Verschlüsselung, Infrastruktur oder Sicherheitsereignis.";
      proposedText = `\n\n[TOM-Prüfnotiz ${today()}]\nÄnderung: ${source.description || source.summary}\nBetroffene Systeme: ${source.affected_systems || "zu prüfen"}\nEmpfohlene Prüfung: ${(source.measures || []).join("; ")}\n`;
    } else if (targetType === "Kundeninformation" && (source.affected_documents || []).includes("Kundeninformation")) {
      proposalType = "append_section";
      reason = "Kundeninformation wahrscheinlich betroffen, da Kundenbezug oder wesentliche externe Änderung erkannt wurde.";
      proposedText = `\n\n[Kundenhinweis-Entwurf ${today()}]\nWir prüfen eine technische oder organisatorische Änderung: ${source.description || source.summary}\nAuswirkung: ${source.impact_level}. Vor Versand fachlich/rechtlich prüfen.\n`;
    } else if (mode === "external") {
      reason = "Externe Änderung analysiert; Zielauswirkung nicht eindeutig. Prüfnotiz statt automatischer Textänderung.";
      warnings.push("Bitte prüfe manuell, ob dieser Hinweis in das ausgewählte interne Dokument gehört.");
    }

    return { proposal_id: proposalId, source_change_id: source.change_id || source.external_change_id, target_document_id: target.document_id, proposal_type: proposalType, proposed_text: proposedText, reason, status: "draft", warnings, created_at: new Date().toISOString(), source_snapshot: source };
  }

  function renderProposal(proposal) {
    $("proposalText").value = proposal.proposed_text;
    $("proposalMeta").className = "detail-box";
    $("proposalMeta").innerHTML = `<dl><dt>proposal_id</dt><dd>${escapeHtml(proposal.proposal_id)}</dd><dt>Typ</dt><dd>${escapeHtml(proposal.proposal_type)}</dd><dt>Zieldokument</dt><dd>${escapeHtml(proposal.target_document_id)}</dd><dt>Grund</dt><dd>${escapeHtml(proposal.reason)}</dd><dt>Status</dt><dd>${escapeHtml(proposal.status)}</dd></dl>${proposal.warnings.length ? `<div class="alert warning">${proposal.warnings.map(escapeHtml).join("<br>")}</div>` : ""}`;
    $("applyProposalBtn").disabled = false;
    $("saveReviewBtn").disabled = false;
    $("discardProposalBtn").disabled = false;
    showMessage("proposalMessage", "Änderungsvorschlag als Entwurf erzeugt. Bitte bearbeiten und erst dann übernehmen oder als Prüfhinweis speichern.", "warning");
  }

  function renderProposalEmpty() {
    if (currentProposal) return;
    $("proposalMeta").className = "detail-box empty-state";
    $("proposalMeta").textContent = "Noch kein Vorschlag erzeugt.";
    $("proposalText").value = "";
    $("applyProposalBtn").disabled = true;
    $("saveReviewBtn").disabled = true;
    $("discardProposalBtn").disabled = true;
  }

  function applyCurrentProposal() {
    if (!currentProposal) return;
    const doc = documents.find((item) => item.document_id === currentProposal.target_document_id);
    if (!doc) return;
    if (!confirm("Änderung wirklich übernehmen? Die alte Version bleibt erhalten und eine neue Version wird erzeugt.")) return;
    const oldText = doc.current_text;
    const oldVersion = doc.version;
    const editedText = $("proposalText").value;
    const newText = currentProposal.proposal_type === "replace_section" ? editedText : `${oldText}\n${editedText}`;
    const newVersion = incrementVersion(oldVersion);
    const version = { version_id: nextId("VER", versions.length + 1), document_id: doc.document_id, old_version: oldVersion, new_version: newVersion, old_text: oldText, new_text: newText, change_summary: currentProposal.reason, created_at: new Date().toISOString(), created_from_change_id: currentProposal.source_change_id };
    versions.push(version);
    doc.current_text = newText;
    doc.version = newVersion;
    doc.updated_at = today();
    doc.hash = hashText(newText);
    currentProposal.status = "applied";
    history.push({ ...(currentProposal.source_snapshot || {}), entry_type: "document_version", change_id: currentProposal.source_change_id, date: today(), target_document_id: doc.document_id, old_version: oldVersion, new_version: newVersion, impact_level: currentProposal.source_snapshot?.impact_level || "", affected_documents: currentProposal.source_snapshot?.affected_documents || [doc.document_type], measures: currentProposal.source_snapshot?.measures || [], summary: `Vorschlag ${currentProposal.proposal_id} übernommen; neue Dokumentversion ${newVersion} erstellt.`, status: "übernommen", saved_at: new Date().toISOString() });
    saveAll();
    renderAll();
    showMessage("proposalMessage", `Änderung übernommen. Neue Version ${escapeHtml(newVersion)} für ${escapeHtml(doc.document_id)} wurde erstellt.`, "warning");
    currentProposal = null;
    renderProposalEmpty();
  }

  function saveCurrentProposalAsReview() {
    if (!currentProposal) return;
    currentProposal.status = "review_saved";
    history.push({ ...(currentProposal.source_snapshot || {}), entry_type: "review_note", change_id: currentProposal.source_change_id, date: today(), target_document_id: currentProposal.target_document_id, old_version: "", new_version: "", impact_level: currentProposal.source_snapshot?.impact_level || "", affected_documents: currentProposal.source_snapshot?.affected_documents || [], measures: currentProposal.source_snapshot?.measures || [], summary: `Nur als Prüfhinweis gespeichert: ${currentProposal.reason}`, status: "Prüfhinweis", saved_at: new Date().toISOString() });
    saveAll();
    renderHistory();
    renderProposalList();
    renderDashboard();
    showMessage("proposalMessage", "Vorschlag wurde nur als Prüfhinweis in der Historie gespeichert. Das Dokument wurde nicht geändert.", "warning");
  }

  function discardCurrentProposal() {
    if (!currentProposal) return;
    currentProposal.status = "discarded";
    history.push({ entry_type: "proposal", change_id: currentProposal.source_change_id, date: today(), target_document_id: currentProposal.target_document_id, old_version: "", new_version: "", impact_level: currentProposal.source_snapshot?.impact_level || "", affected_documents: currentProposal.source_snapshot?.affected_documents || [], measures: currentProposal.source_snapshot?.measures || [], summary: `Vorschlag ${currentProposal.proposal_id} verworfen. Keine Dokumentänderung.`, status: "verworfen", saved_at: new Date().toISOString() });
    saveAll();
    renderHistory();
    renderProposalList();
    renderDashboard();
    currentProposal = null;
    renderProposalEmpty();
    showMessage("proposalMessage", "Vorschlag verworfen. Es wurde keine Dokumentversion erstellt.", "warning");
  }

  function compareExternalChange() {
    const doc = documents.find((item) => item.document_id === $("externalDocumentSelect").value);
    const newText = $("externalNewText").value.trim();
    if (!doc || !newText) {
      showMessage("externalErrors", "Bitte Bestandsdokument wählen und neuen Text einfügen oder hochladen.", "danger");
      return;
    }
    hideMessage("externalErrors");
    const comparison = compareTexts(doc.current_text, newText);
    const keywords = detectKeywords(`${comparison.added.join("\n")}\n${newText}`);
    const evaluation = evaluateExternalDiff(doc, newText, comparison, keywords);
    lastExternalEvaluation = evaluation;
    activeMode = "external";
    saveExternalEvaluationIfNeeded();
    saveAll();
    renderHistory();
    renderDashboard();
    renderExternalResult(comparison, keywords, evaluation);
  }

  function compareTexts(oldText, newText) {
    const oldHash = hashText(oldText);
    const newHash = hashText(newText);
    const oldParts = splitComparableText(oldText);
    const newParts = splitComparableText(newText);
    const oldSet = new Set(oldParts);
    const newSet = new Set(newParts);
    return { old_hash: oldHash, new_hash: newHash, identical: oldHash === newHash, added: newParts.filter((part) => !oldSet.has(part)), removed: oldParts.filter((part) => !newSet.has(part)) };
  }

  function evaluateExternalDiff(doc, newText, comparison, keywords) {
    let impact = "Low";
    const warnings = [];
    const affected = ["Änderungshistorie"];
    if (comparison.identical) warnings.push("Keine Textänderung erkannt.");
    const highKeywords = ["Subunternehmer", "Auftragsverarbeiter", "personenbezogene Daten", "Kundendaten", "Drittland", "USA", "Sicherheitsvorfall", "Datenschutzvorfall"];
    if (!comparison.identical && keywords.some((keyword) => highKeywords.includes(keyword))) impact = "High";
    else if (!comparison.identical && keywords.length) impact = "Medium";
    if (keywords.some((keyword) => ["Dienstleister", "Subunternehmer", "Auftragsverarbeiter", "AVV", "Drittland", "USA"].includes(keyword))) affected.push("AVV");
    if (keywords.some((keyword) => ["Backup", "Verschlüsselung", "Rollen", "Rechte", "Zugriff", "TOM", "Hosting", "Cloud", "Sicherheitsvorfall"].includes(keyword))) affected.push("TOM");
    if (doc.document_type === "Nutzungsbedingungen" || keywords.some((keyword) => ["Nutzungsbedingungen", "Drittland", "USA", "Subunternehmer"].includes(keyword))) affected.push("Kundeninformation");
    const pseudoChange = { change_type: "Sonstiges / Unklar", description: `Externe Änderung in ${doc.title}`, security_change: keywords.some((k) => ["Sicherheitsvorfall", "Backup", "Verschlüsselung"].includes(k)) ? "Ja" : "Unklar", affected_systems: doc.title, personal_data: keywords.some((k) => ["personenbezogene Daten", "Kundendaten"].includes(k)) ? "Ja" : "Unklar", customers_affected: affected.includes("Kundeninformation") ? "Ja" : "Unklar", external_parties: "Ja", number_of_customers: "", date: today(), source: "Externe Änderung", old_text: doc.current_text, new_text: newText };
    const measures = deriveMeasures(pseudoChange, [...new Set(affected)], impact, keywords);
    return { external_change_id: nextId("EXT", history.length + 1), change_id: nextId("EXT", history.length + 1), date: today(), change_type: "Externe Dokumentänderung", description: `Externe Änderung analysiert: ${doc.title}`, affected_systems: doc.title, personal_data: pseudoChange.personal_data, customers_affected: pseudoChange.customers_affected, external_parties: "Ja", security_change: pseudoChange.security_change, impact_level: impact, gdpr_relevance: impact === "Low" ? "Keine direkte DSGVO-Relevanz" : "DSGVO-relevant", affected_documents: [...new Set(affected)], measures, customer_information_required: affected.includes("Kundeninformation"), manual_review_required: impact !== "Low" || warnings.length > 0, summary: comparison.identical ? "Keine Textänderung erkannt; keine neue Version nötig." : `Externe Änderung mit Schlüsselbegriffen erkannt: ${keywords.join(", ") || "keine"}.`, warnings, old_text: doc.current_text, new_text: newText, source_document_id: doc.document_id };
  }

  function renderExternalResult(comparison, keywords, evaluation) {
    const levelClass = evaluation.impact_level.toLowerCase();
    $("externalResult").className = "result-card";
    $("externalResult").innerHTML = `<span class="impact-badge impact-${levelClass}">${escapeHtml(evaluation.impact_level)}</span><div><strong>Alter Hash:</strong> ${escapeHtml(comparison.old_hash)}</div><div><strong>Neuer Hash:</strong> ${escapeHtml(comparison.new_hash)}</div>${comparison.identical ? `<div class="result-message low">Keine Textänderung erkannt.</div>` : ""}<div><strong>Erkannte Schlüsselbegriffe:</strong>${renderChipList(keywords.length ? keywords : ["keine"] )}</div><div><strong>Wahrscheinlich betroffene interne Dokumente:</strong>${renderChipList(evaluation.affected_documents)}</div><div><strong>Maßnahmen:</strong>${renderChipList(evaluation.measures)}</div><div><strong>Diff:</strong><div class="diff-box"><h4>Hinzugefügt</h4>${comparison.added.length ? comparison.added.map((part) => `<ins>${escapeHtml(part)}</ins>`).join("") : "<p>Keine hinzugefügten Absätze/Wörter.</p>"}<h4>Entfernt</h4>${comparison.removed.length ? comparison.removed.map((part) => `<del>${escapeHtml(part)}</del>`).join("") : "<p>Keine entfernten Absätze/Wörter.</p>"}</div></div>${evaluation.warnings.length ? `<div class="alert warning">${evaluation.warnings.map(escapeHtml).join("<br>")}</div>` : ""}`;
  }

  function saveExternalEvaluationIfNeeded() {
    if (lastExternalEvaluation && !history.some((item) => item.change_id === lastExternalEvaluation.change_id)) {
      history.push({ ...lastExternalEvaluation, entry_type: "external_analysis", status: "analysiert", saved_at: new Date().toISOString() });
    }
  }

  function importExternalTextFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    readFile(file, (text) => {
      $("externalNewText").value = file.name.toLowerCase().endsWith(".csv") ? parseCsv(text).map((row) => Object.values(row).join(" ")).join("\n") : text;
      event.target.value = "";
    });
  }

  async function loadSampleChanges(isAutomatic) {
    hideMessage("importErrors");
    try {
      const response = await fetch("data/sample_changes.csv", { cache: "no-store" });
      if (!response.ok) throw new Error("Beispieldatei konnte nicht geladen werden.");
      importRows(parseCsv(await response.text()), isAutomatic ? "automatisch geladene CSV-Beispieldatei" : "CSV-Beispieldatei");
    } catch (error) {
      const evaluated = FALLBACK_SAMPLE_CHANGES.map((change) => ({ ...change, ...evaluateChange(change), entry_type: "internal_change", status: "Beispiel", saved_at: new Date().toISOString() }));
      history = [...history, ...evaluated];
      saveAll();
      renderHistory();
      renderDashboard();
      showMessage("importErrors", isAutomatic ? "Beim Doppelklick-Start konnte data/sample_changes.csv eventuell nicht geladen werden. Fallback-Beispieländerungen wurden lokal geladen." : "Browser konnte data/sample_changes.csv nicht direkt laden. Fallback-Beispieländerungen wurden geladen.", "warning");
    }
  }

  function importCsvFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    readFile(file, (text) => {
      try { importRows(parseCsv(text), file.name); }
      catch (error) { showMessage("importErrors", `CSV konnte nicht gelesen werden: ${escapeHtml(error.message)}`, "danger"); }
      event.target.value = "";
    });
  }

  function importRows(rows, sourceName) {
    if (!rows.length) return showMessage("importErrors", "Die CSV-Datei ist leer.", "danger");
    const missingColumns = REQUIRED_FIELDS.filter((field) => !(field in rows[0]));
    if (missingColumns.length) return showMessage("importErrors", `Ungültige CSV-Spalten. Fehlende Pflichtspalten: ${missingColumns.join(", ")}`, "danger");
    const imported = [];
    const errors = [];
    rows.forEach((row, index) => {
      const change = normalizeChange(row);
      const validationErrors = validateChange(change);
      if (validationErrors.length) errors.push(`Zeile ${index + 2}: ${validationErrors.join("; ")}`);
      else imported.push({ ...change, ...evaluateChange(change), entry_type: "internal_change", status: "importiert", saved_at: new Date().toISOString() });
    });
    history = [...history, ...imported];
    saveAll();
    renderHistory();
    renderDashboard();
    showMessage("importErrors", `${imported.length} Einträge aus ${escapeHtml(sourceName)} importiert.${errors.length ? " Fehler: " + errors.map(escapeHtml).join(" | ") : ""}`, errors.length ? "warning" : "warning");
  }

  function importChangeFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    readFile(file, (text) => {
      if (file.name.toLowerCase().endsWith(".csv")) {
        const first = parseCsv(text)[0];
        if (first) setFormData({ ...normalizeChange(first), source: file.name });
      } else {
        setFormData({ ...getFormData(), change_id: $("change_id").value || `TXT-${Date.now()}`, date: $("date").value || today(), description: text, source: file.name, affected_systems: $("affected_systems").value || "Aus TXT zu prüfen" });
      }
      event.target.value = "";
    });
  }

  function renderHistory() {
    const thead = document.querySelector("#historyTable thead");
    const tbody = document.querySelector("#historyTable tbody");
    thead.innerHTML = `<tr>${HISTORY_COLUMNS.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>`;
    tbody.innerHTML = history.length ? history.map((entry) => `<tr>${HISTORY_COLUMNS.map((column) => `<td>${formatTableValue(column, entry[column])}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${HISTORY_COLUMNS.length}">Noch keine Änderungshistorie vorhanden.</td></tr>`;
  }

  function exportHistoryCsv() {
    downloadFile("dsgvo-change-history.csv", toCsv(history, [...INPUT_FIELDS, ...OUTPUT_FIELDS, "entry_type", "target_document_id", "old_version", "new_version", "status", "saved_at"]), "text/csv;charset=utf-8");
  }

  function clearLocalData() {
    if (!confirm("Lokale Daten wirklich löschen? Dokumente, Versionen, Vorschläge und Historie werden aus localStorage entfernt.")) return;
    history = [];
    documents = [];
    versions = [];
    proposals = [];
    currentProposal = null;
    lastEvaluation = null;
    lastExternalEvaluation = null;
    if (isLocalStorageAvailable()) [HISTORY_KEY, DOCUMENTS_KEY, VERSIONS_KEY, PROPOSALS_KEY].forEach((key) => localStorage.removeItem(key));
    renderAll();
    renderEmptyResult("Lokale Daten wurden gelöscht.");
    $("externalResult").className = "empty-state";
    $("externalResult").textContent = "Noch kein Vergleich gestartet.";
  }

  function resetForm() {
    document.getElementById("changeForm").reset();
    ["security_change", "personal_data", "customers_affected", "external_parties"].forEach((id) => populateSelect(id, YES_NO_UNKNOWN, "Nein"));
    $("date").value = today();
    $("source").value = "Manuelle Eingabe";
    $("saveBtn").disabled = true;
    lastEvaluation = null;
    renderEmptyResult("Noch keine Bewertung.");
    hideMessage("validationErrors");
  }

  function applyEmailText() {
    const text = $("emailText").value.trim();
    if (text) applyEmailData(parseEmlText(text), text);
  }

  function importEmlFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    readFile(file, (text) => { applyEmailData(parseEmlText(text), text); event.target.value = ""; });
  }

  function parseEmlText(text) {
    const getHeader = (name) => (text.match(new RegExp(`^${name}:\\s*(.+)$`, "im")) || [])[1]?.trim() || "";
    return { sender: getHeader("From") || getHeader("Absender"), subject: getHeader("Subject") || getHeader("Betreff"), date: getHeader("Date") || getHeader("Datum"), body: text.includes("\n\n") ? text.split(/\r?\n\r?\n/).slice(1).join("\n\n").trim() : text.trim() };
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
    if (combined.includes("backup")) $("change_type").value = "Backup geändert";
    if (combined.includes("kundendaten") || combined.includes("personenbezogen")) { $("personal_data").value = "Ja"; $("customers_affected").value = "Ja"; }
    if (["Neuer Dienstleister", "Neuer Subunternehmer"].includes($("change_type").value)) $("external_parties").value = "Ja";
    $("notes").value = [$("notes").value, "E-Mail-Inhalt wurde manuell übernommen; vor dem Speichern prüfen."].filter(Boolean).join("\n");
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", inQuotes = false;
    const normalized = text.replace(/^\uFEFF/, "");
    for (let i = 0; i < normalized.length; i += 1) {
      const char = normalized[i], next = normalized[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') { cell += '"'; i += 1; }
        else inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) { row.push(cell); cell = ""; }
      else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(cell);
        if (row.some((value) => value.trim() !== "")) rows.push(row);
        row = []; cell = "";
      } else cell += char;
    }
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
    if (!rows.length) return [];
    const headers = rows[0].map((header) => header.trim());
    return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
  }

  function toCsv(rows, columns) {
    const escapeCell = (value) => {
      const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    return [columns.join(","), ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(","))].join("\n");
  }

  function readFile(file, callback) {
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result || ""));
    reader.onerror = () => alert("Datei konnte nicht gelesen werden.");
    reader.readAsText(file, "utf-8");
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

  function hashText(text) {
    const normalized = normalizeText(text);
    let hash = 0x811c9dc5;
    for (let i = 0; i < normalized.length; i += 1) {
      hash ^= normalized.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return `h-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function splitComparableText(text) {
    const paragraphs = String(text || "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
    return paragraphs.length > 1 ? paragraphs : String(text || "").split(/(?<=[.!?])\s+|\n+/).map((part) => part.trim()).filter(Boolean);
  }

  function detectKeywords(text) {
    const lower = String(text || "").toLowerCase();
    return KEYWORDS.filter((keyword) => lower.includes(keyword.toLowerCase()));
  }

  function incrementVersion(version) {
    const parts = String(version || "1.0").split(".").map((part) => Number(part));
    if (!Number.isFinite(parts[0])) return "1.1";
    const minor = Number.isFinite(parts[1]) ? parts[1] + 1 : 1;
    return `${parts[0]}.${minor}`;
  }

  function formatDate(value) {
    if (!value) return "-";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("de-DE");
  }

  function nextId(prefix, number) {
    return `${prefix}-${String(number).padStart(3, "0")}`;
  }

  function renderChipList(items) {
    return `<ul class="chip-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function formatTableValue(column, value) {
    if (column === "impact_level" && value) return `<span class="table-impact impact-${String(value).toLowerCase()}">${escapeHtml(value)}</span>`;
    if (Array.isArray(value)) return escapeHtml(value.join("; "));
    if (typeof value === "boolean") return value ? "Ja" : "Nein";
    return escapeHtml(value ?? "");
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
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
})();
