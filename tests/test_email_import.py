from email.message import EmailMessage

from src.email_import import email_config_available, email_to_draft_change, parse_email_message


def test_parse_dummy_email_and_create_draft_change(monkeypatch):
    message = EmailMessage()
    message["Message-ID"] = "<abc123@example.com>"
    message["From"] = "dienstleister@example.com"
    message["Subject"] = "Neuer Dienstleister für Ticketsystem"
    message["Date"] = "Tue, 09 Jun 2026 10:30:00 +0000"
    message.set_content("Ein neuer Dienstleister verarbeitet Kundendaten.")

    email_data = parse_email_message(message)
    draft = email_to_draft_change(email_data)

    assert email_data["email_message_id"] == "<abc123@example.com>"
    assert draft["change_type"] == "Neuer Dienstleister"
    assert draft["personal_data"] == "Ja"
    assert draft["source"] == "E-Mail"


def test_missing_email_credentials_disables_import(monkeypatch):
    for key in ["EMAIL_IMAP_HOST", "EMAIL_USERNAME", "EMAIL_PASSWORD"]:
        monkeypatch.delenv(key, raising=False)

    assert email_config_available() is False
