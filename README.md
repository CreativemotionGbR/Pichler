# Lokale DSGVO-Änderungsbewertungs-App

Dieses Projekt ist eine erste MVP-Version einer lokal ausführbaren Python-/Streamlit-App zur Bewertung und Dokumentation DSGVO-relevanter technischer Änderungen.

Die App läuft lokal auf einem Windows-PC und benötigt keine Cloud-Dienste, keine n8n-Installation, keine API-Keys und keine externen LLM-Aufrufe.

## Funktionsumfang im MVP

- lokale Streamlit-Oberfläche
- manuelle Änderungseingabe über Formular
- CSV-/Excel-Import vorbereiteter Änderungen
- regelbasierte Bewertung in `Low`, `Medium` oder `High`
- AVV- und TOM-Zuordnung
- Maßnahmenableitung
- lokale Speicherung in `data/change_history.csv`
- Beispieldaten in `data/sample_changes.csv`
- vorbereiteter, deaktivierbarer E-Mail-Import ohne echte IMAP-Verbindung
- Tests mit `pytest`

## Projektstruktur

```text
project/
  app.py
  requirements.txt
  README.md
  .gitignore
  .env.example
  data/
    sample_changes.csv
    change_history.csv
  src/
    rules.py
    validation.py
    storage.py
    diff_utils.py
    email_import.py
  tests/
    test_rules.py
    test_validation.py
    test_email_import.py
```

## Installation unter Windows

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## App starten

```powershell
streamlit run app.py
```

Danach öffnet Streamlit eine lokale Weboberfläche im Browser. Alle Daten bleiben lokal im Projektordner.

## Tests ausführen

```powershell
pytest
```

## Datenmodell

Pflichtfelder:

- `change_id`
- `date`
- `change_type`
- `description`
- `security_change`
- `affected_systems`
- `personal_data`
- `customers_affected`
- `external_parties`

Optionale Felder:

- `source`
- `source_url`
- `number_of_customers`
- `old_text`
- `new_text`
- `notes`
- `email_message_id`
- `email_sender`
- `email_subject`
- `email_received_at`
- `email_folder`

## Regelbewertung

Die Bewertung ist rein regelbasiert. Wenn mehrere Regeln zutreffen, gewinnt die höchste Stufe: `High` vor `Medium` vor `Low`.

Beispiele:

- neuer Dienstleister mit personenbezogenen Daten → `High`, AVV betroffen
- Software-Update ohne Datenbezug → `Low`
- API-Änderung mit personenbezogenen Daten → `High`, AVV/TOM betroffen
- unbekannter oder unklarer Änderungstyp → `Medium`, manuelle Prüfung
- Sicherheitsänderung, Backup, Rechte/Rollen, Verschlüsselung oder MFA/Login → TOM betroffen

Wichtig: Die Regelbewertung ersetzt keine rechtliche Prüfung.

## Lokale Speicherung

Bewertete Änderungen werden lokal in folgender Datei gespeichert:

```text
data/change_history.csv
```

Beispieldaten liegen in:

```text
data/sample_changes.csv
```

## CSV-/Excel-Import

Die App akzeptiert `.csv` und `.xlsx`-Dateien. Importdateien müssen mindestens die Pflichtspalten enthalten. Fehlende Pflichtspalten werden in der Oberfläche angezeigt, ohne dass die App abstürzt.

## Optionaler E-Mail-Import

Der E-Mail-Import ist im MVP nur vorbereitet. Es wird keine echte IMAP-Verbindung aufgebaut und es werden keine E-Mails gelöscht, verschoben, beantwortet oder versendet.

Falls später eine lokale E-Mail-Konfiguration genutzt wird, darf sie nur über lokale Umgebungsvariablen oder eine `.env`-Datei erfolgen. Die Datei `.env` ist in `.gitignore` ausgeschlossen. Im Repository liegt nur `.env.example` mit Platzhaltern.

## Modulübersicht

- `app.py`: Streamlit-Oberfläche, Formular, Importbereich und Anzeige der Bewertung
- `src/rules.py`: Impact-Logik, AVV-/TOM-Regeln und Maßnahmenableitung
- `src/validation.py`: Pflichtfeldprüfung, Datumsprüfung und Normalisierung
- `src/storage.py`: Laden, Bewerten und Speichern lokaler CSV-Daten
- `src/diff_utils.py`: Textvergleich und Hash-Funktionen
- `src/email_import.py`: vorbereitete Dummy-Funktionen für optionalen E-Mail-Import
- `tests/`: pytest-Tests für Regeln, Validierung und Dummy-E-Mail-Verarbeitung

## Verification Checklist

- [x] App startet lokal mit `streamlit run app.py`
- [x] Startup-Logik lädt lokale Daten
- [x] Beispieldaten sind vorhanden
- [x] Nutzer kann Änderungen manuell erfassen
- [x] Pflichtfelder werden validiert
- [x] Low/Medium/High-Klassifikation ist implementiert
- [x] AVV/TOM-Zuordnung ist implementiert
- [x] Maßnahmen werden abgeleitet
- [x] Ergebnis wird lokal gespeichert
- [x] E-Mail-Import ist optional und vorbereitet
- [x] fehlende E-Mail-Zugangsdaten lassen die App weiterlaufen
- [x] Tests sind mit `pytest` ausführbar
- [x] keine n8n-Dateien, keine Secrets, keine Cloud-Pflicht

## Open decisions

- Der E-Mail-Import ist im MVP nur vorbereitet; echte IMAP-Anbindung bleibt eine spätere Entscheidung.
- Website-Monitoring ist nicht Teil dieses MVP.
- Ergebnisse werden im MVP als CSV gespeichert; JSON kann später ergänzt werden.
- AVV-/TOM-Dokumente werden nicht automatisch geändert, sondern nur als betroffen markiert.
