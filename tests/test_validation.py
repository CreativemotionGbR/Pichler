from src.validation import normalize_change, validate_change


def valid_change(**overrides):
    change = {
        "change_id": "CHG-VAL",
        "date": "2026-06-09",
        "change_type": "Software-Update ohne Datenbezug",
        "description": "Beschreibung vorhanden.",
        "security_change": "Nein",
        "affected_systems": "System",
        "personal_data": "Nein",
        "customers_affected": "Nein",
        "external_parties": "Nein",
    }
    change.update(overrides)
    return change


def test_valid_change_passes_validation():
    is_valid, errors = validate_change(valid_change())

    assert is_valid is True
    assert errors == []


def test_missing_description_returns_validation_error():
    is_valid, errors = validate_change(valid_change(description=""))

    assert is_valid is False
    assert "Pflichtfeld 'description' fehlt." in errors


def test_invalid_yes_no_unknown_value_returns_error():
    is_valid, errors = validate_change(valid_change(security_change="Vielleicht"))

    assert is_valid is False
    assert "Feld 'security_change' muss Ja, Nein oder Unklar sein." in errors


def test_normalize_change_strips_strings():
    normalized = normalize_change(valid_change(change_id=" CHG-1 "))

    assert normalized["change_id"] == "CHG-1"
