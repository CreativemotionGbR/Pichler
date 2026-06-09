"""Lokale Streamlit-App für die DSGVO-Änderungsbewertung."""
from datetime import date
import json

import pandas as pd
import streamlit as st

from src.diff_utils import create_text_diff
from src.email_import import email_config_available, fetch_email_drafts
from src.rules import KNOWN_CHANGE_TYPES, YES_NO_UNKNOWN, evaluate_change
from src.storage import load_history, read_import_file, save_change, validate_import_columns
from src.validation import ALL_INPUT_FIELDS, normalize_change, validate_change

st.set_page_config(page_title="DSGVO-Änderungsbewertung", layout="wide")


def _list_to_text(value):
    if isinstance(value, list):
        return "\n".join(f"- {item}" for item in value)
    return value


def show_result(result: dict) -> None:
    st.subheader("Bewertungsergebnis")
    col1, col2, col3 = st.columns(3)
    col1.metric("Impact-Level", result["impact_level"])
    col2.metric("DSGVO-Relevanz", result["gdpr_relevance"])
    col3.metric("Manuelle Prüfung", "Ja" if result["manual_review_required"] else "Nein")
    st.write("**Betroffene Dokumente**")
    st.write(_list_to_text(result["affected_documents"]))
    st.write("**Maßnahmen**")
    st.write(_list_to_text(result["measures"]))
    if result["customer_information_required"]:
        st.info("Kundeninformation erforderlich. Im MVP wird nur ein Entwurf vorbereitet, keine E-Mail versendet.")
        st.text_area("E-Mail-Entwurf", value=f"Betreff: Information zu technischer Änderung {result['change_id']}\n\n{result['summary']}", height=120)
    if result.get("warnings"):
        st.warning("\n".join(result["warnings"]))
    st.success(result["summary"])


def manual_form() -> None:
    st.header("Neue Änderung manuell erfassen")
    with st.form("change_form"):
        col1, col2 = st.columns(2)
        change_id = col1.text_input("change_id *", placeholder="CHG-006")
        selected_date = col2.date_input("date *", value=date.today())
        change_type = st.selectbox("change_type *", KNOWN_CHANGE_TYPES)
        description = st.text_area("description *")
        col3, col4, col5 = st.columns(3)
        security_change = col3.selectbox("security_change *", YES_NO_UNKNOWN, index=1)
        personal_data = col4.selectbox("personal_data *", YES_NO_UNKNOWN, index=1)
        customers_affected = col5.selectbox("customers_affected *", YES_NO_UNKNOWN, index=1)
        col6, col7 = st.columns(2)
        external_parties = col6.selectbox("external_parties *", YES_NO_UNKNOWN, index=1)
        affected_systems = col7.text_input("affected_systems *")
        col8, col9, col10 = st.columns(3)
        source = col8.text_input("source", value="Manuelle Eingabe")
        source_url = col9.text_input("source_url")
        number_of_customers = col10.number_input("number_of_customers", min_value=0, value=0, step=1)
        old_text = st.text_area("old_text")
        new_text = st.text_area("new_text")
        notes = st.text_area("notes")
        submitted = st.form_submit_button("Bewerten und speichern")

    if submitted:
        change = normalize_change({
            "change_id": change_id,
            "date": selected_date,
            "change_type": change_type,
            "description": description,
            "security_change": security_change,
            "affected_systems": affected_systems,
            "personal_data": personal_data,
            "customers_affected": customers_affected,
            "external_parties": external_parties,
            "source": source,
            "source_url": source_url,
            "number_of_customers": number_of_customers,
            "old_text": old_text,
            "new_text": new_text,
            "notes": notes,
        })
        response = save_change(change)
        if response["status"] == "error":
            st.error("\n".join(response["warnings"]))
        else:
            show_result(response["output"])
            if old_text or new_text:
                st.code(create_text_diff(old_text, new_text), language="diff")


def import_section() -> None:
    st.header("CSV-/Excel-Import")
    uploaded_file = st.file_uploader("Vorbereitete Änderungen importieren", type=["csv", "xlsx"])
    if uploaded_file is None:
        return
    try:
        df = read_import_file(uploaded_file)
    except Exception as exc:  # Streamlit zeigt dem lokalen Nutzer den konkreten Importfehler.
        st.error(f"Datei konnte nicht gelesen werden: {exc}")
        return
    missing = validate_import_columns(df)
    if missing:
        st.error(f"Import nicht möglich. Fehlende Pflichtspalten: {', '.join(missing)}")
        return
    st.dataframe(df)
    if st.button("Importierte Änderungen bewerten und speichern"):
        successes = 0
        errors = []
        for _, row in df.iterrows():
            response = save_change(row.to_dict())
            if response["status"] == "success":
                successes += 1
            else:
                errors.append(f"{row.get('change_id', 'ohne ID')}: {'; '.join(response['warnings'])}")
        st.success(f"{successes} Änderungen gespeichert.")
        if errors:
            st.warning("\n".join(errors))


def email_section() -> None:
    st.header("Optionaler E-Mail-Import")
    if not email_config_available():
        st.info("E-Mail-Import ist deaktiviert. Die App läuft ohne .env oder Zugangsdaten weiter.")
        return
    drafts, warnings = fetch_email_drafts()
    for warning in warnings:
        st.warning(warning)
    if drafts:
        st.write("Importierte E-Mail-Entwürfe müssen vor dem Speichern geprüft werden.")
        st.json(drafts)


def main() -> None:
    st.title("Lokale DSGVO-Änderungsbewertung")
    st.caption("MVP: lokale Regelbewertung, keine Cloud, kein n8n, keine externen LLM-Aufrufe.")
    history = load_history()
    st.header("Änderungshistorie")
    if history.empty:
        st.info("Noch keine gespeicherten Änderungen vorhanden. Beispieldaten liegen in data/sample_changes.csv.")
    else:
        st.dataframe(history, use_container_width=True)
    manual_form()
    import_section()
    email_section()
    with st.expander("Datenvertrag und Pflichtfelder"):
        st.write("Pflichtfelder: change_id, date, change_type, description, security_change, affected_systems, personal_data, customers_affected, external_parties")
        st.write("Alle Felder:")
        st.code(json.dumps(ALL_INPUT_FIELDS, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
