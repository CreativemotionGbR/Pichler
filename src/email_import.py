"""Vorbereiteter, optionaler E-Mail-Import für ein späteres MVP-Inkrement.

Diese Datei enthält bewusst nur Dummy-/Hilfsfunktionen. Es wird keine echte
IMAP-Verbindung geöffnet, solange fetch_email_drafts nicht später bewusst
implementiert wird. Die App bleibt ohne E-Mail-Konfiguration voll nutzbar.
"""
import os
from email.message import EmailMessage
from email.utils import parsedate_to_datetime


def email_config_available() -> bool:
    """Prüft nur lokale Umgebungsvariablen; keine Verbindung, keine Secrets im Code."""
    required = ["EMAIL_IMAP_HOST", "EMAIL_USERNAME", "EMAIL_PASSWORD"]
    return all(os.getenv(key) for key in required)


def fetch_email_drafts(limit: int = 10) -> tuple[list[dict], list[str]]:
    """Platzhalter für einen späteren lesenden IMAP-Import.

    Sicherheitsregeln für die spätere Umsetzung:
    - nur lesen, niemals löschen, verschieben oder beantworten
    - Zugangsdaten nur aus .env oder Umgebung laden
    - importierte Nachrichten vor dem Speichern durch Nutzer prüfen lassen
    """
    if not email_config_available():
        return [], ["E-Mail-Import ist deaktiviert, weil lokale Zugangsdaten fehlen."]
    return [], ["E-Mail-Import ist vorbereitet, aber im MVP noch nicht mit IMAP verbunden."]


def parse_email_message(message: EmailMessage, folder: str = "INBOX") -> dict:
    """Extrahiert Metadaten und Text aus einer Dummy-E-Mail für Tests."""
    body = ""
    if message.is_multipart():
        for part in message.walk():
            if part.get_content_type() == "text/plain":
                body = part.get_content()
                break
    else:
        body = message.get_content()
    received_at = ""
    if message.get("Date"):
        try:
            received_at = parsedate_to_datetime(message.get("Date")).isoformat()
        except (TypeError, ValueError):
            received_at = ""
    return {
        "email_message_id": message.get("Message-ID", ""),
        "email_sender": message.get("From", ""),
        "email_subject": message.get("Subject", ""),
        "email_received_at": received_at,
        "email_folder": folder,
        "source": "E-Mail",
        "description": (body or "").strip(),
    }


def email_to_draft_change(email_data: dict) -> dict:
    """Erzeugt einen prüfpflichtigen Änderungseintrag aus E-Mail-Dummy-Daten."""
    subject_body = f"{email_data.get('email_subject', '')} {email_data.get('description', '')}".lower()
    change_type = "Sonstiges / Unklar"
    if "dienstleister" in subject_body:
        change_type = "Neuer Dienstleister"
    if "subunternehmer" in subject_body:
        change_type = "Neuer Subunternehmer"
    personal_data = "Ja" if any(word in subject_body for word in ["kundendaten", "personenbezogen", "personenbezogene daten"]) else "Unklar"
    return {
        "change_id": f"EMAIL-{email_data.get('email_message_id', 'draft').strip('<>') or 'draft'}",
        "date": (email_data.get("email_received_at") or "")[:10],
        "change_type": change_type,
        "description": email_data.get("description", ""),
        "security_change": "Unklar",
        "affected_systems": "Unklar",
        "personal_data": personal_data,
        "customers_affected": personal_data,
        "external_parties": "Ja" if change_type in {"Neuer Dienstleister", "Neuer Subunternehmer"} else "Unklar",
        "source": "E-Mail",
        "source_url": "",
        "number_of_customers": "",
        "old_text": "",
        "new_text": "",
        "notes": "Aus E-Mail importierter Entwurf; vor Speicherung manuell prüfen.",
        **email_data,
    }
