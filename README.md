# Lokale DSGVO-Änderungsbewertungs-App

Diese Version ist eine reine lokale HTML/CSS/JavaScript-App. Sie benötigt keine Installation, kein Terminal, kein Python, kein Streamlit, kein VS Code, keine Cloud-Dienste und keine externen APIs.

## Start

1. ZIP herunterladen oder Ordner öffnen.
2. `index.html` doppelt anklicken.
3. Die App öffnet sich im Browser.
4. Keine Installation notwendig.

## Projektstruktur

```text
project/
  index.html
  styles.css
  script.js
  README.md
  data/
    sample_changes.csv
```

## Was die App kann

- technische Änderungen über ein lokales Formular erfassen
- Pflichtfelder validieren
- Änderungen regelbasiert als `Low`, `Medium` oder `High` bewerten
- AVV- und TOM-Relevanz ableiten
- konkrete Maßnahmen anzeigen
- eine lokale Änderungshistorie im Browser mit `localStorage` speichern
- gespeicherte Änderungen beim nächsten Öffnen wieder laden
- Beispieldaten aus `data/sample_changes.csv` laden
- bei Browser-Sicherheitsbeschränkungen Fallback-Beispieldaten aus `script.js` laden
- CSV-Dateien über Dateiupload importieren
- Änderungshistorie als CSV oder JSON exportieren
- optional E-Mail-Text oder `.eml`-Dateien manuell einlesen und daraus Formularfelder vorbefüllen

## Datenschutz und lokale Nutzung

- Alle Daten bleiben lokal im Browser.
- Es gibt keine Datenübertragung ins Internet.
- Es werden keine externen JavaScript-Bibliotheken verwendet.
- Es gibt keine Cookies für Tracking.
- Die App verwendet nur `localStorage` für lokale Speicherung.
- Es gibt keinen echten E-Mail-Login.
- Es gibt kein IMAP im Browser.
- Es werden keine Zugangsdaten abgefragt oder gespeichert.
- Es werden keine E-Mails automatisch versendet.
- Die Bewertung ist eine regelbasierte Dokumentationshilfe und ersetzt keine rechtliche Prüfung.

## Eingabefelder

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
- `email_sender`
- `email_subject`
- `email_received_at`

## Regelbewertung

Die Bewertung erfolgt vollständig lokal in `script.js`. Wenn mehrere Regeln zutreffen, gewinnt die höchste Stufe: `High` vor `Medium` vor `Low`.

### High

- `external_parties = Ja` und `personal_data = Ja`
- Änderungstyp deutet auf neuen Dienstleister, Dienstleisterwechsel, Subunternehmer, Freelancer-Zugriff, API-Datenübertragung, Infrastruktur-/Cloud-/Hosting-Änderung, Sicherheitsereignis, Verschlüsselungsänderung, Backup-Änderung oder Rechte-/Rollenkonzept hin
- `customers_affected = Ja` und `number_of_customers > 10`

### Medium

- eines der DSGVO-relevanten Pflichtfelder ist `Unklar`
- Änderungstyp ist unbekannt oder `Sonstiges / Unklar`

### Low

- `personal_data = Nein`
- `external_parties = Nein`
- `customers_affected = Nein`
- `security_change = Nein`

## AVV-/TOM-Zuordnung

AVV ist betroffen bei:

- `Neuer Dienstleister`
- `Wechsel Dienstleister`
- `Neuer Subunternehmer`
- `Freelancer mit Zugriff`
- `external_parties = Ja` und `personal_data = Ja`

TOM ist betroffen bei:

- `security_change = Ja`
- `Backup geändert`
- `Rechte-/Rollenkonzept geändert`
- `Verschlüsselung geändert`
- `Infrastrukturänderung`
- `Datenschutzvorfall / Sicherheitsereignis`

## Buttons in der App

- **Änderung bewerten**: prüft das Formular und zeigt das Ergebnis an.
- **Änderung speichern**: speichert die zuletzt bewertete Änderung in `localStorage`.
- **Beispieldaten laden**: lädt `data/sample_changes.csv`; bei Browser-Blockade werden Fallback-Daten aus `script.js` genutzt.
- **CSV importieren**: importiert lokale CSV-Dateien über Dateiupload.
- **JSON exportieren**: lädt die lokale Änderungshistorie als JSON-Datei herunter.
- **CSV exportieren**: lädt die lokale Änderungshistorie als CSV-Datei herunter.
- **lokale Daten löschen**: leert die im Browser gespeicherte Änderungshistorie.

## CSV-Import

Die CSV-Datei muss mindestens diese Pflichtspalten enthalten:

```text
change_id,date,change_type,description,security_change,affected_systems,personal_data,customers_affected,external_parties
```

Optionale Spalten können zusätzlich enthalten sein. Ungültige oder leere CSV-Dateien werden mit einer klaren Fehlermeldung angezeigt.

## Manuelle Testtabelle

| Nr. | Testfall | Eingabe | Erwartetes Ergebnis |
| --- | --- | --- | --- |
| 1 | Neuer Dienstleister mit personenbezogenen Daten | `change_type = Neuer Dienstleister`, `personal_data = Ja`, `external_parties = Ja`, `customers_affected = Ja` | `High`, AVV betroffen |
| 2 | Software-Update ohne Datenbezug | `change_type = Software-Update ohne Datenbezug`, alle DSGVO-Felder `Nein` | `Low`, nur dokumentieren |
| 3 | API-Änderung mit personenbezogenen Daten | `change_type = API-Änderung`, `personal_data = Ja` | `High` |
| 4 | Fehlende Beschreibung | `description` leer lassen | Validierungsfehler, keine Speicherung |
| 5 | Sonstiges / Unklar | `change_type = Sonstiges / Unklar` | `Medium`, manuelle Prüfung erforderlich |
| 6 | Sicherheitsänderung | `security_change = Ja` oder `change_type = Rechte-/Rollenkonzept geändert` | TOM betroffen |
| 7 | CSV-Import mit gültigen Daten | `data/sample_changes.csv` über Dateiupload auswählen | Einträge erscheinen in der Tabelle |
| 8 | Export als CSV/JSON | Nach gespeicherten Einträgen Export-Buttons klicken | Datei wird heruntergeladen |
| 9 | Lokale Daten löschen | Button „lokale Daten löschen“ klicken und bestätigen | Tabelle wird geleert |

## Fehlerbehandlung

- Fehlende Pflichtfelder werden oberhalb des Formulars angezeigt.
- Ungültige Datumswerte werden angezeigt.
- Ungültige CSV-Spalten werden angezeigt.
- Leere CSV-Dateien werden angezeigt.
- Unbekannter Änderungstyp wird als `Medium` mit Warnung bewertet.
- Gleicher alter und neuer Text erzeugt den Hinweis „keine Textänderung erkannt“.
- Wenn `localStorage` nicht verfügbar ist, zeigt die App eine Warnung an.

## Open decisions

- Ob eine spätere Version wieder automatisierte Tests mit einem Browser-Testframework erhalten soll.
- Ob die Änderungshistorie zusätzlich als lokale Datei über die File System Access API gespeichert werden soll; diese Browser-API ist nicht überall verfügbar.
- Ob `.eml`-Anhänge später strukturiert ausgewertet werden sollen. Im MVP wird nur Text grob extrahiert.
