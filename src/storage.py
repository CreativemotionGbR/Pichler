"""Lokale CSV-Speicherung für Änderungshistorie und Importdateien."""
from pathlib import Path
import json

import pandas as pd

from src.rules import evaluate_change
from src.validation import ALL_INPUT_FIELDS, normalize_change, validate_change

DATA_DIR = Path("data")
SAMPLE_PATH = DATA_DIR / "sample_changes.csv"
HISTORY_PATH = DATA_DIR / "change_history.csv"
OUTPUT_FIELDS = [
    "impact_level",
    "gdpr_relevance",
    "affected_documents",
    "measures",
    "customer_information_required",
    "manual_review_required",
    "summary",
    "warnings",
]
STORAGE_COLUMNS = ALL_INPUT_FIELDS + OUTPUT_FIELDS


def ensure_data_files() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not SAMPLE_PATH.exists():
        pd.DataFrame(columns=ALL_INPUT_FIELDS).to_csv(SAMPLE_PATH, index=False, encoding="utf-8-sig")
    if not HISTORY_PATH.exists():
        sample = pd.read_csv(SAMPLE_PATH, dtype=str, encoding="utf-8-sig") if SAMPLE_PATH.exists() else pd.DataFrame()
        if sample.empty:
            pd.DataFrame(columns=STORAGE_COLUMNS).to_csv(HISTORY_PATH, index=False, encoding="utf-8-sig")
        else:
            evaluated = [prepare_storage_row(row.to_dict()) for _, row in sample.iterrows()]
            pd.DataFrame(evaluated, columns=STORAGE_COLUMNS).to_csv(HISTORY_PATH, index=False, encoding="utf-8-sig")


def _json(value) -> str:
    return json.dumps(value, ensure_ascii=False) if isinstance(value, (list, dict)) else value


def prepare_storage_row(change: dict) -> dict:
    normalized = normalize_change(change)
    valid, errors = validate_change(normalized)
    row = {field: normalized.get(field, "") for field in ALL_INPUT_FIELDS}
    if valid:
        result = evaluate_change(normalized)
        for field in OUTPUT_FIELDS:
            row[field] = _json(result.get(field, ""))
    else:
        for field in OUTPUT_FIELDS:
            row[field] = ""
        row["warnings"] = _json(errors + ["Bewertung nicht möglich, da erforderliche Angaben fehlen."])
    return row


def load_history() -> pd.DataFrame:
    ensure_data_files()
    return pd.read_csv(HISTORY_PATH, dtype=str, encoding="utf-8-sig").fillna("")


def save_change(change: dict) -> dict:
    normalized = normalize_change(change)
    valid, errors = validate_change(normalized)
    if not valid:
        return {"status": "error", "output": None, "warnings": errors + ["Bewertung nicht möglich, da erforderliche Angaben fehlen."]}
    result = evaluate_change(normalized)
    row = prepare_storage_row(normalized)
    history = load_history()
    history = pd.concat([history, pd.DataFrame([row])], ignore_index=True)
    history.to_csv(HISTORY_PATH, index=False, encoding="utf-8-sig")
    return {"status": "success", "output": result, "warnings": result.get("warnings", [])}


def read_import_file(uploaded_file) -> pd.DataFrame:
    filename = uploaded_file.name.lower()
    if filename.endswith(".xlsx"):
        return pd.read_excel(uploaded_file, dtype=str).fillna("")
    return pd.read_csv(uploaded_file, dtype=str, encoding="utf-8-sig").fillna("")


def validate_import_columns(df: pd.DataFrame) -> list[str]:
    missing = [field for field in ALL_INPUT_FIELDS if field in ["change_id", "date", "change_type", "description", "security_change", "affected_systems", "personal_data", "customers_affected", "external_parties"] and field not in df.columns]
    return missing
