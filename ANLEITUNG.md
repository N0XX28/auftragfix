# AuftragFix – Kfz-Werkstatt-Prototyp

AuftragFix ist eine React-Native-/Expo-App für den Werkstattalltag: Kunden und Fahrzeuge einmal erfassen, anschließend neue Aufträge mit den vorhandenen Stammdaten anlegen und die verknüpften Daten für eine spätere Datenbankübernahme exportieren.

## Sofort ausprobieren

Die App startet im **Demomodus** mit ausschließlich fiktiven Daten. Unter **Kunden** öffnen Sie einen Kundeneintrag: Dort stehen Telefonnummer, Fahrzeugdetails und die zugehörige Auftrags-/Reparaturhistorie. Ein Kunde kann mehrere Fahrzeuge besitzen.

Unter **Neuer Auftrag** suchen und wählen Sie einen vorhandenen Kunden aus. Anschließend wählen Sie sein Fahrzeug. Fehlende Kunden und Fahrzeuge können direkt innerhalb dieses Ablaufs hinzugefügt werden. Vorname, Telefonnummer oder Fahrzeugdetails müssen bei Folgeaufträgen nicht erneut eingetragen werden.

## Bereiche

| Bereich | Funktionen |
| --- | --- |
| Übersicht | Aktive Aufträge, heutige Deadlines, überfällige Aufträge, offenes Auftragsvolumen und Terminradar |
| Aufträge | Suche nach Kunde, Kennzeichen oder Auftragsbezeichnung; Status-/Terminfilter; anzeigen, anlegen, bearbeiten und nach Bestätigung löschen; Kundenrechnung als PDF erstellen |
| Kunden | Durchsuchbare Kundenkartei; Name, Telefonnummer, Rechnungsadresse, E-Mail und Notizen; mehrere Fahrzeuge; Fahrzeugdetails und Reparaturhistorie |
| Daten & Export | Lokalen Demomodus oder privaten SQL-Datenspeicher auswählen; SQL-, JSON- und CSV-Export samt Vorschau |

## Erfasste Angaben

Ein Auftrag enthält Kunden- und Fahrzeugzuordnung, Auftragsbezeichnung und Nummer, Eingang, Deadline, tatsächliche Fertigstellung, Bearbeitungsstatus, Schäden/Befund, Leistungen, mehrere Messwerte mit Bezeichnung/Wert/Einheit, eigene Kosten und Verkaufspreis. Die Differenz aus Preis und eigenen Kosten wird automatisch angezeigt. Alle Geldwerte werden intern als ganze Cent gespeichert; die Anzeige ist in EUR. Die Auftragskalkulation selbst bleibt ohne Steuerumrechnung; für die PDF-Rechnung wählen Sie die Preis- und Steuerbasis ausdrücklich separat.

Fahrzeuge besitzen Kennzeichen, Marke, Modell, Baujahr, FIN, Kilometerstand und Kraftstoff/Antrieb. Die Reparaturhistorie wird aus den zugehörigen Aufträgen gebildet und kann je Fahrzeug gefiltert werden.

## Ersatzteilpreise und automatische Summen

Im Auftragsformular unter **04 / Ersatzteile & Kalkulation** können Sie mit **Ersatzteil hinzufügen** mehrere Positionen anlegen. Für jede Position erfassen Sie Bezeichnung, Menge, Einkaufspreis und Verkaufspreis pro Stück. Mengen sind ganze Zahlen ab 1. Positionen lassen sich bearbeiten und über das Papierkorbsymbol entfernen. Die Preise pro Position berücksichtigen automatisch die Menge.

| Eingabe | Bedeutung |
| --- | --- |
| Einkauf pro Stück | Ihre Beschaffungskosten für ein Ersatzteil |
| Verkauf pro Stück | Der dem Kunden berechnete Preis für ein Ersatzteil |
| Weitere eigene Kosten | Zusätzliche Kosten, die nicht bereits bei den Ersatzteilen stehen |
| Arbeitslohn / weitere Leistungen | Zusätzlicher Kundenpreis für Arbeit und Leistungen, ohne nochmals die Ersatzteile einzurechnen |

> **Gesamtkosten = Summe(Menge × Teile-Einkaufspreis) + weitere eigene Kosten**
>
> **Gesamtpreis = Summe(Menge × Teile-Verkaufspreis) + Arbeitslohn / weitere Leistungen**
>
> **Differenz = Gesamtpreis − Gesamtkosten**

Die Kalkulation aktualisiert sich bei jeder Änderung. Gesamtkosten und Gesamtpreis werden beim Speichern auf dem Server nochmals aus den Einzelwerten berechnet und in Auftragsdetails, Übersicht und Export verwendet. Ersatzteilpositionen bleiben mit Mengen und Einzelpreisen gespeichert. Aufträge ohne Teile sind weiterhin möglich. Ungültige Mengen, negative Preise und zu große Summen werden abgewiesen.

**Vorhandene Aufträge bleiben erhalten:** Bisherige Kosten und Preise ohne Teilepositionen werden als Basiswerte übernommen. Wenn Sie einen alten Gesamtbetrag nachträglich in Ersatzteile aufteilen, reduzieren Sie die betreffenden Basiswerte entsprechend, damit dieselben Kosten bzw. Preise nicht doppelt gezählt werden. Es werden keine erfundenen Positionen in bestehende Aufträge eingefügt.

## Kundenrechnung als PDF

Öffnen Sie einen Auftrag und wählen Sie **Rechnung als PDF**. Ergänzen bzw. prüfen Sie Werkstattname und -anschrift, Steuerkennung, Kundenanschrift, eine eigene eindeutige Rechnungsnummer, Rechnungsdatum und Leistungsdatum. Bei einem fertigen Auftrag wird das Fertigstellungsdatum als Leistungsdatum vorgeschlagen. Zahlungsfrist, IBAN/BIC und Kundenhinweise sind optional. Die Kundenadresse kann dauerhaft unter **Kunden → Kunde bearbeiten → Rechnungsadresse** gespeichert werden und wird beim nächsten Rechnungsformular übernommen. Änderungen der Adresse nur im Rechnungsformular betreffen ausschließlich diese PDF.

| Preisbasis | Berechnung auf der Rechnung |
| --- | --- |
| Preise netto | Gespeicherte Verkaufspreise sind der Nettobetrag; Umsatzsteuer gemäß gewähltem Satz wird addiert. |
| Preise brutto | Gespeicherte Verkaufspreise bleiben der Gesamtbetrag; der enthaltene Steuerbetrag wird daraus berechnet. |
| Ohne USt-Ausweis | Kein zusätzlicher Steuerbetrag; tragen Sie einen für Ihre Werkstatt zutreffenden Steuerhinweis ein. |

Die App wählt keine Steuerbasis und keinen Steuersatz automatisch. Alle Rechnungspositionen verwenden den gewählten einheitlichen Satz; unterschiedliche Steuersätze pro Position sind nicht implementiert. Rechnungsbeträge werden Cent-genau berechnet. Die Auftragsdaten werden dadurch nicht geändert.

**PDF herunterladen / teilen** erstellt eine echte A4-PDF mit Rechnungssteller, Kunde, Rechnungs-/Leistungsdatum, Fahrzeug-/Auftragsbezug, Ersatzteilen mit Mengen und Verkaufspreisen, Arbeitslohn als zusammengefasster Position, Leistungsbeschreibung, Steuer und Gesamtbetrag. Längere Rechnungen werden auf weitere Seiten umgebrochen. Einkaufspreise, eigene Kosten, Differenz, Schäden, interne Messwerte und Kundennotizen bleiben vollständig außerhalb der Kundenrechnung.

Im Web wird eine PDF-Datei heruntergeladen. Nativ wird die Datei im temporären Cache erzeugt und über den Datei-Teilen-Dialog bereitgestellt. Die Werkstattangaben werden nach erfolgreicher PDF-Bereitstellung auf diesem Gerät gespeichert, getrennt nach Demo/SQL und angemeldetem Konto; sie werden nicht über die SQL-Datenbank auf andere Geräte synchronisiert. Rechnungsinhalte werden zur PDF-Erzeugung nicht an einen externen PDF-Dienst geschickt.

**Zum Ausprobieren:** Im Demomodus können Sie **Fiktives Demobeispiel laden** wählen. Jede Demo-PDF ist dauerhaft sichtbar als **MUSTER – KEINE ECHTE RECHNUNG** gekennzeichnet. Die Beispielangaben sind keine echten Steuer- oder Bankdaten.

**Grenzen:** Die Datei wird nicht automatisch an den Kunden versandt. Die Funktion bietet noch keinen globalen Nummernkreis, kein unveränderbares Rechnungsarchiv und keine elektronische Rechnung mit strukturierten Rechnungsdaten. Bitte Ihre tatsächlichen Steuerangaben, Rechnungsnummer, Angaben und Anforderungen vor realer Verwendung prüfen und die erzeugte Datei selbst aufbewahren. Ein tatsächlicher nativer Gerätetest ist noch nicht erfolgt.

## Datenspeicherung

**Demo (lokal):** Fiktive Beispieldaten und Ihre Änderungen werden auf dem jeweiligen Gerät bzw. im jeweiligen Browser über AsyncStorage gespeichert. Sie werden nicht automatisch in die echte Datenbank übertragen. Browserdaten-Löschen oder App-Deinstallation kann lokale Daten entfernen; wichtige Daten vorher exportieren. Dieser Modus ist zum Ausprobieren gedacht, nicht als gesicherter Mehrbenutzerbetrieb für reale Kundendaten.

**Private SQL-Datenbank:** Die verwaltete MySQL-Datenbank und die Tabellen sind eingerichtet. Für ihre Nutzung müssen Sie sich unter **Daten & Export → Anmelden & SQL-Datenbank nutzen** anmelden. Datensätze sind an das angemeldete Konto gebunden; Kunden- und Fahrzeugbeziehungen werden auf dem Server geprüft. Der SQL-Modus braucht eine Netzwerkverbindung und startet ohne Beispieldaten. Demodaten bleiben separat. Gemeinsame Team-/Werkstattkonten und Rechteverwaltung über mehrere Mitarbeiter sind nicht Bestandteil dieses Prototyps.

## Export in eine spätere Datenbank

| Format | Inhalt und Verwendung |
| --- | --- |
| SQL | Eigenständiges MySQL-8-Schema für `customers`, `vehicles` und `orders`, inklusive Fremdschlüsseln und INSERTs. Ersatzteile als vollständige JSON-Positionsliste; Basis- und Gesamtbeträge in Cent. In eine neue/leere Zieldatenbank importieren. Keine bestehenden IDs überschreiben. |
| JSON | Schemaversion 3: sämtliche Kunden einschließlich Rechnungsadresse, Fahrzeuge und Aufträge mit stabilen IDs, Beziehungen, Ersatzteilpositionen, Mengen, Einzelpreisen und Geldbeträgen in Cent; geeignet als Grundlage für eigene Importprogramme und andere SQL-Systeme. |
| CSV | Flache Auftragstabelle mit Kunden-/Fahrzeugangaben, Ersatzteilpositionen als JSON-Feld (Einzelpreise in Cent), Teile-/Basis-Zwischensummen und Gesamtbeträgen in EUR, Semikolon-Trennung. Kunden ohne Auftrag sind darin nicht enthalten; dafür SQL oder JSON verwenden. |

Im Web werden Dateien heruntergeladen; unter iOS/Android wird der vollständige SQL-/JSON-/CSV-Exporttext über den nativen Teilen-Dialog bereitgestellt. Ein direkter Dateiexport dieser drei Formate in die native Dateien-App ist noch nicht implementiert; PDF-Rechnungen werden dagegen als echte Datei geteilt. Die App verbindet sich nicht automatisch mit Ihrer späteren externen SQL-Datenbank.

Exportdateien enthalten personenbezogene Daten: sicher aufbewahren und nur berechtigten Personen zur Verfügung stellen.

## Technischer Stand und Grenzen

Der Prototyp verwendet den vorhandenen Expo-Router-/React-Native-/TypeScript-Starter. MySQL-Tabellen wurden durch additive Migration eingerichtet und schreibfrei auf Erreichbarkeit geprüft. TypeScript, Kernregeln, Exportlogik, nicht authentifizierter API-Zugriff und OAuth-Nonce-Regeln wurden automatisiert geprüft. Die mobile Webdarstellung wurde auf einen beobachteten Renderingfehler geprüft und korrigiert.

Der reale Anmeldeeinstieg wurde bis zur Anmeldeseite geprüft; eine abgeschlossene persönliche Anmeldung und echte Kundendaten-Speicherung sind damit nicht als End-to-End-Test behauptet. Kein Testdatensatz wurde in der privaten SQL-Datenbank angelegt. Ein tatsächlicher Test auf iOS/Android, ein APK-/IPA-Build und eine Veröffentlichung im App Store/Play Store sind noch nicht erfolgt. Die Webvorschau ist keine veröffentlichte Produktions-App.

Vor dem Einsatz mit echten Kundendaten sollten insbesondere Zugriffs-/Teamrollen, Sicherung, Datenschutzanforderungen und der Import in Ihr konkretes SQL-System abgestimmt werden.

## Entwicklung

```bash
pnpm check
pnpm test
pnpm db:push
pnpm dev
```

Metro/Web nutzt Port 8081, die API Port 3000. Die Datenbankmigration wird vor dem ersten API-Zugriff ausgeführt. Datenbank- und Authentifizierungsgeheimnisse werden ausschließlich auf dem Server verwendet und sind nicht in Exportdateien oder im App-Bundle enthalten.

## Gesicherter Entwicklungsstand

Der API-Build und die TypeScript-Prüfung sind erfolgreich; 66 automatische Prüfungen bestehen, einschließlich Ersatzteilkalkulation, Formulareingaben, Altbeständen, Exporten sowie Rechnungsberechnung, Vertraulichkeit, echter PDF-Erzeugung, Mehrseitenumbruch und binärem Web-Download. Ein bestehender Auth-Test ohne Testsession ist übersprungen. Die Datenbank wurde ausschließlich additiv erweitert, ohne vorhandene Kunden oder Aufträge zu überschreiben. Der vollständige Expo-Web-Build wurde ebenfalls geprüft. Der Quellcode wird auf dem kanonischen Projekt-Branch `main` gespeichert. Eine separate Bestätigung als Manus-Versionskarte wurde bisher nicht bereitgestellt und ist deshalb nicht als verifiziert behauptet. Die Vorschau ist nutzbar; es wurde keine öffentliche Veröffentlichung ausgelöst.
