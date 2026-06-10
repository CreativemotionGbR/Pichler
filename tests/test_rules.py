from src.rules import evaluate_change, is_avv_affected, is_tom_affected


def base_change(**overrides):
    change = {
        "change_id": "CHG-T",
        "date": "2026-06-09",
        "change_type": "Software-Update ohne Datenbezug",
        "description": "Interne technische Wartung ohne Datenbezug.",
        "security_change": "Nein",
        "affected_systems": "Build-System",
        "personal_data": "Nein",
        "customers_affected": "Nein",
        "external_parties": "Nein",
        "number_of_customers": 0,
        "old_text": "",
        "new_text": "",
        "notes": "",
    }
    change.update(overrides)
    return change


def test_new_provider_with_customer_data_is_high_and_avv_affected():
    change = base_change(
        change_type="Neuer Dienstleister",
        description="Neuer Dienstleister verarbeitet Kundendaten.",
        personal_data="Ja",
        customers_affected="Ja",
        external_parties="Ja",
        number_of_customers=12,
    )

    result = evaluate_change(change)

    assert result["impact_level"] == "High"
    assert "AVV" in result["affected_documents"]
    assert is_avv_affected(change)
    assert result["customer_information_required"] is True


def test_software_update_without_data_relevance_is_low():
    result = evaluate_change(base_change())

    assert result["impact_level"] == "Low"
    assert result["affected_documents"] == ["Änderungshistorie"]
    assert "keine Kundeninfo nötig" in result["measures"]


def test_api_change_with_personal_data_is_high_and_tom_affected():
    change = base_change(
        change_type="API-Änderung",
        description="API überträgt personenbezogene Daten an angebundenes System.",
        personal_data="Ja",
        customers_affected="Ja",
        external_parties="Ja",
        affected_systems="CRM API",
    )

    result = evaluate_change(change)

    assert result["impact_level"] == "High"
    assert "AVV" in result["affected_documents"]
    assert "TOM" in result["affected_documents"]
    assert is_tom_affected(change)


def test_unknown_change_type_is_medium():
    result = evaluate_change(base_change(change_type="Neues unbekanntes Tool"))

    assert result["impact_level"] == "Medium"
    assert result["manual_review_required"] is True


def test_security_change_affects_tom():
    change = base_change(
        change_type="Rechte-/Rollenkonzept geändert",
        description="MFA Login und Rollen werden angepasst.",
        security_change="Ja",
        personal_data="Ja",
        customers_affected="Ja",
    )

    result = evaluate_change(change)

    assert result["impact_level"] == "High"
    assert "TOM" in result["affected_documents"]
    assert "Zugriffskontrolle prüfen" in result["measures"]
