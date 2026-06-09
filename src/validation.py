"""Validierung und Normalisierung von Änderungseinträgen."""
from datetime import date, datetime

from src.rules import KNOWN_CHANGE_TYPES, YES_NO_UNKNOWN

REQUIRED_FIELDS = [
    "change_id",
    "date",
    "change_type",
    "description",
    "security_change",
    "affected_systems",
    "personal_data",
    "customers_affected",
    "external_parties",
]

OPTIONAL_FIELDS = [
    "source",
    "source_url",
    "number_of_customers",
    "old_text",
    "new_text",
    "notes",
    "email_message_id",
    "email_sender",
    "email_subject",
    "email_received_at",
    "email_folder",
]

ALL_INPUT_FIELDS = REQUIRED_FIELDS + OPTIONAL_FIELDS


def normalize_change(change: dict) -> dict:
    normalized = {field: change.get(field, "") for field in ALL_INPUT_FIELDS}
    for key, value in list(normalized.items()):
        if isinstance(value, str):
            normalized[key] = value.strip()
        elif isinstance(value, date):
            normalized[key] = value.isoformat()
    if normalized.get("number_of_customers") in (None, ""):
        normalized["number_of_customers"] = ""
    return normalized


def validate_change(change: dict) -> tuple[bool, list[str]]:
    errors = []
    normalized = normalize_change(change)
    for field in REQUIRED_FIELDS:
        if normalized.get(field) in (None, ""):
            errors.append(f"Pflichtfeld '{field}' fehlt.")

    try:
        datetime.fromisoformat(str(normalized.get("date", "")))
    except ValueError:
        errors.append("Pflichtfeld 'date' enthält kein gültiges ISO-Datum.")

    for field in ["security_change", "personal_data", "customers_affected", "external_parties"]:
        if normalized.get(field) not in YES_NO_UNKNOWN:
            errors.append(f"Feld '{field}' muss Ja, Nein oder Unklar sein.")

    if normalized.get("change_type") and normalized.get("change_type") not in KNOWN_CHANGE_TYPES:
        # Unbekannte Typen sind fachlich bewertbar, aber werden als Medium markiert.
        pass

    if normalized.get("number_of_customers") not in (None, ""):
        try:
            number = int(float(normalized["number_of_customers"]))
            if number < 0:
                errors.append("Feld 'number_of_customers' darf nicht negativ sein.")
        except ValueError:
            errors.append("Feld 'number_of_customers' muss eine Zahl sein.")
    return not errors, errors
