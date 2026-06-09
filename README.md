# Lokale DSGVO-Dokumentenverwaltung und Änderungsbewertung

Diese App ist eine reine lokale HTML/CSS/JavaScript-Anwendung. Sie läuft per Doppelklick auf `index.html` direkt im Browser und benötigt keine Installation, kein Terminal, kein Python, kein Streamlit, keinen Server, keine Cloud und keine externen APIs.

Das Tool erstellt regelbasierte Prüfhinweise und Änderungsvorschläge. Es gibt keine Rechtsberatung und ersetzt keine fachliche oder rechtliche Prüfung.

## Start

1. ZIP herunterladen oder Projektordner öffnen.
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

## Was neu ist

Die App verwaltet jetzt nicht nur einzelne Änderungen, sondern auch lokale Dokumente und Versionen:

- Dokumentenbibliothek für AVV-, TOM-, Kundeninformations- und externe Dokumente
- zwei Arbeitsmodi für interne und externe Änderungen
- regelbasierte Low-/Medium-/High-Bewertung
- Diff zwischen alter und neuer Textversion
- erkannte Schlüsselbegriffe
- Änderungsvorschläge als bearbeitbare Entwürfe
- Übernahme nur nach aktiver Nutzerbestätigung
- neue Dokumentversion bei jeder bestätigten Übernahme
- alte Version bleibt in der Versionshistorie erhalten
- lokale Speicherung über `localStorage`
- JSON-/CSV-Export für Dokumente und Historie

## Modus A: Interne Änderung übertragen

Dieser Modus ist für Änderungen, die intern erfasst werden, z. B. neuer Dienstleister, neuer Subunternehmer, API-Änderung, Backup-Änderung, Verschlüsselungsänderung, Rollen-/Rechteänderung oder Datenschutzvorfall.

Ablauf:

1. Änderung manuell erfassen oder aus CSV/TXT importieren.
2. Button **Änderung bewerten** klicken.
3. App bewertet Impact-Level, AVV-/TOM-Relevanz, Maßnahmen und Warnungen.
4. Zieldokument aus der Dokumentenbibliothek auswählen.
5. Button **Änderungsvorschlag erzeugen** klicken.
6. Entwurf prüfen und bei Bedarf bearbeiten.
7. Entweder **Änderung übernehmen**, **Nur als Prüfhinweis speichern** oder **Verwerfen** wählen.

Wichtig: Dokumente werden niemals automatisch überschrieben. Erst der Button **Änderung übernehmen** erzeugt eine neue Dokumentversion.

## Modus B: Externe Änderung analysieren

Dieser Modus ist für neue oder geänderte externe Texte, z. B. Nutzungsbedingungen eines Dienstleisters, eine neue Dienstleister-AVV oder geänderte Datenschutzbedingungen.

Ablauf:

1. Gespeichertes Bestandsdokument auswählen.
2. Neuen Text einfügen oder TXT/CSV hochladen.
3. Button **Externe Änderung vergleichen** klicken.
4. App berechnet Hashes, zeigt Diff, markiert hinzugefügte und entfernte Textteile und erkennt Schlüsselbegriffe.
5. App bewertet das Risiko und zeigt betroffene interne Dokumenttypen.
6. Optional kann daraus ein Änderungsvorschlag für ein internes Dokument erzeugt werden.

Auch hier gilt: Eine Übernahme passiert nur nach aktiver Bestätigung durch den Nutzer.

## Dokumentenbibliothek

Ein Dokument wird lokal ungefähr so gespeichert:

```json
{
  "document_id": "AVV-001",
  "document_type": "AVV",
  "title": "AVV Cloud-Dienstleister",
  "version": "1.0",
  "current_text": "Aktueller Dokumenttext...",
  "source_file": "sample",
  "created_at": "2026-06-09",
  "updated_at": "2026-06-09",
  "hash": "h-..."
}
```

Erlaubte Dokumenttypen:

- AVV
- TOM
- Datenschutzhinweis
- Änderungshistorie
- Kundeninformation
- Incident-Dokumentation
- Nutzungsbedingungen
- Dienstleister-AVV
- Sonstiges

## Versionierung

Jede bestätigte Übernahme erzeugt eine neue Version. Die alte Version bleibt als Versionseintrag erhalten:

```json
{
  "version_id": "VER-001",
  "document_id": "AVV-001",
  "old_version": "1.0",
  "new_version": "1.1",
  "old_text": "...",
  "new_text": "...",
  "change_summary": "Neuer Dienstleister mit personenbezogenen Daten erkannt.",
  "created_at": "2026-06-09T10:30:00.000Z",
  "created_from_change_id": "CHG-001"
}
```

Die App aktualisiert das aktuelle Dokument erst nach Bestätigung. Vorher bleibt der Änderungsvorschlag ein Entwurf.

## Änderungsvorschläge

Änderungsvorschläge werden als Entwürfe erzeugt und können vor der Übernahme bearbeitet werden.

Beispiel:

```json
{
  "proposal_id": "PROP-001",
  "source_change_id": "CHG-001",
  "target_document_id": "AVV-001",
  "proposal_type": "append_section",
  "proposed_text": "Vorgeschlagener neuer Abschnitt...",
  "reason": "Neuer Dienstleister mit personenbezogenen Daten erkannt.",
  "status": "draft",
  "warnings": []
}
```

Wenn keine sichere automatische Änderung möglich ist, nutzt die App `manual_review_only` und erzeugt nur einen Prüfhinweis.

## Beispiele

### Beispiel für ein AVV-Dokument

Das Beispieldokument `AVV-001` beschreibt einen anonymisierten Cloud-Dienstleister. Bei einem neuen Dienstleister, Subunternehmer oder externer Verarbeitung personenbezogener Daten erzeugt die App einen AVV-Ergänzungsvorschlag und Maßnahmen wie „AVV prüfen“, „AVV aktualisieren“ und „Subunternehmerliste prüfen“.

### Beispiel für ein TOM-Dokument

Das Beispieldokument `TOM-001` enthält Abschnitte zu Zugriffskontrolle, Verschlüsselung, Backup und Protokollierung. Bei `Backup geändert`, `Verschlüsselung geändert`, `Rechte-/Rollenkonzept geändert` oder Sicherheitsvorfällen erzeugt die App einen TOM-Prüfhinweis oder TOM-Abschnitt.

### Beispiel für externe Nutzungsbedingungen

Das Beispieldokument `NUTZ-001` simuliert externe Nutzungsbedingungen eines Dienstleisters. Wenn ein neuer Text Begriffe wie „Subunternehmer“, „Drittland“, „USA“ oder „personenbezogene Daten“ enthält, zeigt die App Diff, Schlüsselbegriffe, Risiko und betroffene interne Dokumenttypen wie AVV oder Kundeninformation.

## Datenschutz und lokale Daten

- Alle Daten bleiben lokal im Browser.
- Es gibt keine Datenübertragung ins Internet.
- Es gibt keine Cloud-Speicherung.
- Es werden keine externen APIs oder LLMs aufgerufen.
- Es gibt keine automatische rechtliche Entscheidung.
- Es gibt keine automatische Dokumentüberschreibung.
- Jede Übernahme braucht Nutzerbestätigung.
- Jede Übernahme erzeugt eine neue Version.
- Alte Versionen bleiben erhalten.
- Beispieldaten enthalten keine echten Kundendaten.
- Exportiere wichtige Daten regelmäßig als JSON/CSV, da Browser-localStorage vom Nutzer oder Browser gelöscht werden kann.

## Buttons

- **Beispieldokumente laden**: legt lokale AVV-, TOM-, Kundeninformations- und Nutzungsbedingungen-Beispiele an.
- **Dokumente importieren**: importiert JSON, CSV oder TXT als Dokumente.
- **Dokumentenbibliothek exportieren JSON**: exportiert Dokumente und Versionen.
- **Änderung bewerten**: bewertet eine interne Änderung.
- **Externe Änderung vergleichen**: vergleicht Bestandsdokument und neuen externen Text.
- **Änderungsvorschlag erzeugen**: erstellt einen Entwurf für das gewählte Zieldokument.
- **Änderung übernehmen**: erstellt nach Bestätigung eine neue Dokumentversion.
- **Nur als Prüfhinweis speichern**: speichert Historieneintrag ohne Dokumentänderung.
- **Verwerfen**: verwirft den Entwurf ohne Dokumentänderung und dokumentiert dies in der Historie.
- **Änderungshistorie exportieren CSV/JSON**: exportiert alle Historieneinträge.
- **Lokale Daten löschen**: löscht Dokumente, Versionen, Vorschläge und Historie aus `localStorage`.

## CSV-Import für Änderungen

Die CSV-Datei muss mindestens diese Pflichtspalten enthalten:

```text
change_id,date,change_type,description,security_change,affected_systems,personal_data,customers_affected,external_parties
```

Beispieldaten liegen in `data/sample_changes.csv`.

## Manuelle Testfälle

| Nr. | Testfall | Schritte | Erwartung |
| --- | --- | --- | --- |
| 1 | Interne Änderung: Neuer Dienstleister mit Kundendaten | Beispieldokumente laden, Änderung `Neuer Dienstleister` mit `personal_data = Ja`, `external_parties = Ja`, `customers_affected = Ja` bewerten, `AVV-001` wählen, Vorschlag erzeugen und übernehmen | Impact `High`, AVV betroffen, Änderungsvorschlag für AVV, Übernahme erzeugt neue Version |
| 2 | Interne Änderung: Backup geändert | Änderung `Backup geändert` mit `security_change = Ja` bewerten, `TOM-001` wählen, Vorschlag erzeugen | TOM betroffen, Maßnahme „Backup-Konzept prüfen“, TOM-Prüfhinweis oder TOM-Abschnitt wird vorgeschlagen |
| 3 | Externe Änderung: Nutzungsbedingungen enthalten neuen Subunternehmer | `NUTZ-001` auswählen, neuen Text mit „neuer Subunternehmer verarbeitet Kundendaten“ einfügen, vergleichen | Diff zeigt neuen Subunternehmer, Impact `High`, AVV und Kundeninformation prüfen |
| 4 | Externe Änderung: alter und neuer Text identisch | Text aus Dokumentdetails kopieren und unverändert als neuen externen Text vergleichen | Hinweis „Keine Textänderung erkannt“, keine neue Version nötig |
| 5 | Änderungsvorschlag verwerfen | Einen Vorschlag erzeugen und Button „Verwerfen“ klicken | Keine Änderung am Dokument, Historie enthält Vermerk „verworfen“ |
| 6 | Änderung übernehmen | Vorschlag bearbeiten und Button „Änderung übernehmen“ bestätigen | Neue Dokumentversion wird erstellt, alte Version bleibt erhalten, Änderungshistorie wird aktualisiert |
| 7 | Lokale Daten löschen | Button „Lokale Daten löschen“ klicken und bestätigen | Dokumente, Versionen, Vorschläge und Historie werden gelöscht |

## Akzeptanzkriterien

- App startet per Doppelklick auf `index.html`.
- App funktioniert ohne Installation und ohne Internet.
- Dokumente können lokal gespeichert werden.
- Änderungen können manuell eingegeben werden.
- Externe neue Texte können mit gespeicherten Dokumenten verglichen werden.
- App zeigt Diff zwischen alter und neuer Version.
- App bewertet Impact-Level Low/Medium/High.
- App erzeugt Änderungsvorschläge.
- Änderungsvorschläge können bearbeitet werden.
- Änderungen werden nur nach Nutzerbestätigung übernommen.
- Jede Übernahme erzeugt eine neue Version.
- Alte Versionen bleiben erhalten.
- Änderungshistorie wird lokal gespeichert.
- CSV-/JSON-Export funktioniert.
- README erklärt die Nutzung für nicht-technische Nutzer.

## Open decisions

- Ob spätere Versionen zusätzlich verschlüsselte lokale Backups anbieten sollen.
- Ob Dokumentimporte langfristig Vorlagen für bestimmte AVV-/TOM-Abschnitte erhalten sollen.
- Ob ein späteres Browser-Testframework ergänzt wird. Im MVP sind manuelle Testfälle dokumentiert.
