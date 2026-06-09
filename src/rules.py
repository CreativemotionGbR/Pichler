"""Regelbasierte DSGVO-Änderungsbewertung für das lokale MVP."""

KNOWN_CHANGE_TYPES = [
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
]

YES_NO_UNKNOWN = ["Ja", "Nein", "Unklar"]

HIGH_CHANGE_TYPES = {
    "Neuer Dienstleister",
    "Wechsel Dienstleister",
    "Neuer Subunternehmer",
    "Freelancer mit Zugriff",
    "Rechte-/Rollenkonzept geändert",
    "Verschlüsselung geändert",
    "Datenschutzvorfall / Sicherheitsereignis",
}

TOM_KEYWORDS = [
    "firewall", "netzwerk", "backup", "rechte", "rollen", "verschlüsselung",
    "hosting", "server", "mfa", "login", "monitoring", "logging",
    "verfügbarkeit", "availability", "incident", "sicherheitsereignis",
]

AVV_CHANGE_TYPES = {
    "Neuer Dienstleister",
    "Wechsel Dienstleister",
    "Neuer Subunternehmer",
    "Freelancer mit Zugriff",
}


def _text(change: dict) -> str:
    return " ".join(str(change.get(key, "")) for key in ["change_type", "description", "affected_systems", "notes"]).lower()


def _as_int(value) -> int:
    if value in (None, ""):
        return 0
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def is_unknown_change_type(change_type: str) -> bool:
    return change_type not in KNOWN_CHANGE_TYPES or change_type == "Sonstiges / Unklar"


def is_avv_affected(change: dict) -> bool:
    change_type = change.get("change_type", "")
    text = _text(change)
    external_with_data = change.get("external_parties") == "Ja" and change.get("personal_data") == "Ja"
    keyword_match = any(word in text for word in ["dienstleister", "subunternehmer", "freelancer", "drittland", "datenart"])
    return change_type in AVV_CHANGE_TYPES or external_with_data or keyword_match


def is_tom_affected(change: dict) -> bool:
    text = _text(change)
    change_type = change.get("change_type", "")
    api_with_data = change_type in {"API-Änderung", "API entfernt"} and change.get("personal_data") == "Ja"
    return change.get("security_change") == "Ja" or api_with_data or any(keyword in text for keyword in TOM_KEYWORDS)


def classify_impact(change: dict) -> tuple[str, list[str]]:
    """Bewertet immer nach höchster zutreffender Stufe: High vor Medium vor Low."""
    warnings = []
    impact_score = 1
    change_type = change.get("change_type", "")
    text = _text(change)

    if change.get("external_parties") == "Ja" and change.get("personal_data") == "Ja":
        impact_score = max(impact_score, 3)
    if change_type in HIGH_CHANGE_TYPES:
        impact_score = max(impact_score, 3)
    if change_type in {"API-Änderung", "API entfernt"} and change.get("personal_data") == "Ja":
        impact_score = max(impact_score, 3)
    if change_type == "Infrastrukturänderung" and any(word in text for word in ["hosting", "cloud", "server"]):
        impact_score = max(impact_score, 3)
    if change.get("customers_affected") == "Ja" and _as_int(change.get("number_of_customers")) > 10:
        impact_score = max(impact_score, 3)

    required_gdpr_fields = ["security_change", "personal_data", "customers_affected", "external_parties"]
    if any(change.get(field) == "Unklar" for field in required_gdpr_fields):
        impact_score = max(impact_score, 2)
    if is_unknown_change_type(change_type):
        impact_score = max(impact_score, 2)
        warnings.append("Änderungstyp ist unbekannt oder unklar; manuelle Prüfung erforderlich.")

    if (
        change.get("personal_data") == "Nein"
        and change.get("external_parties") == "Nein"
        and change.get("customers_affected") == "Nein"
        and change.get("security_change") == "Nein"
        and impact_score == 1
    ):
        impact_score = 1

    return {1: "Low", 2: "Medium", 3: "High"}[impact_score], warnings


def affected_documents(change: dict, impact_level: str) -> list[str]:
    documents = ["Änderungshistorie"]
    if is_avv_affected(change):
        documents.append("AVV")
    if is_tom_affected(change):
        documents.append("TOM")
    if customer_information_required(change, impact_level):
        documents.append("Kundeninformation")
    if change.get("change_type") == "Datenschutzvorfall / Sicherheitsereignis":
        documents.append("Incident-Dokumentation")
    return documents


def customer_information_required(change: dict, impact_level: str) -> bool:
    return impact_level == "High" and change.get("customers_affected") == "Ja"


def derive_measures(change: dict, documents: list[str], impact_level: str) -> list[str]:
    measures = []
    if "AVV" in documents:
        measures += ["AVV prüfen", "AVV aktualisieren"]
        if change.get("change_type") in {"Neuer Dienstleister", "Wechsel Dienstleister"}:
            measures.append("AVV neu abschließen")
        if change.get("change_type") == "Neuer Subunternehmer":
            measures.append("Subunternehmerliste prüfen")
    if "TOM" in documents:
        text = _text(change)
        measures.append("Zugriffskontrolle prüfen")
        if "verschlüssel" in text:
            measures.append("Verschlüsselung prüfen")
        if "backup" in text:
            measures.append("Backup-Konzept prüfen")
        if "firewall" in text or "netzwerk" in text:
            measures.append("Netzwerk-/Firewallregel prüfen")
        if "logging" in text or "monitoring" in text:
            measures.append("Protokollierung prüfen")
        if "mfa" in text or "login" in text or "rechte" in text or "rollen" in text:
            measures.append("Zugangskontrolle prüfen")
    if customer_information_required(change, impact_level):
        measures += ["Kundeninformation vorbereiten", "Mail-Template generieren"]
    else:
        measures.append("keine Kundeninfo nötig")
    if impact_level in {"Medium", "High"}:
        measures.append("interne Info vorbereiten")
    return list(dict.fromkeys(measures))


def evaluate_change(change: dict) -> dict:
    impact_level, warnings = classify_impact(change)
    documents = affected_documents(change, impact_level)
    measures = derive_measures(change, documents, impact_level)
    manual_review = impact_level in {"Medium", "High"} or bool(warnings)
    gdpr_relevance = "Keine direkte DSGVO-Relevanz" if impact_level == "Low" else "DSGVO-relevant"
    if change.get("old_text") and change.get("new_text") and change.get("old_text") == change.get("new_text"):
        warnings.append("Alter und neuer Text sind identisch; keine Textänderung erkannt.")
    summary = (
        f"{change.get('change_type', 'Änderung')} wurde als {impact_level} bewertet. "
        f"Betroffene Dokumente: {', '.join(documents)}."
    )
    return {
        "change_id": change.get("change_id", ""),
        "impact_level": impact_level,
        "gdpr_relevance": gdpr_relevance,
        "affected_documents": documents,
        "measures": measures,
        "customer_information_required": customer_information_required(change, impact_level),
        "manual_review_required": manual_review,
        "summary": summary,
        "warnings": warnings,
    }
