# AuftragFix – Werkstatt-Prototyp

## Bestätigter Umfang
Mobile React-Native-App für eine Kfz-Werkstatt. Kundenname, Kennzeichen, Messwerte, Schäden, Leistungen, Auftragseingang, Deadline, Fertigstellung, eigene Kosten und Verkaufspreis werden erfasst. Dashboard, anlegen/anzeigen/bearbeiten/löschen, Suche und Status-/Terminfilter, Validierung und Differenzberechnung sind enthalten. Ergänzt gemäß Nutzerwunsch: Kundenkartei mit Telefonnummer, Fahrzeugdetails und Reparaturhistorie; vorhandene Kunden werden über Namenssuche ausgewählt und müssen nicht erneut eingegeben werden. Export zur schnellen späteren Übernahme in eine SQL-Datenbank.

## Umsetzung
- Vorhandenen Expo-Router-/React-Native-/TypeScript-/NativeWind-Starter erhalten. Native Komponenten; keine Web-Neuentwicklung.
- Vier Arbeitsbereiche: Übersicht, Aufträge, Kunden, Daten & Export. Desktop-Seitenleiste und mobile untere Navigation; Formulare und Details als kontrollierte Modals.
- Relationale verwaltete MySQL-Datenbank mit Kunden, Fahrzeugen und Aufträgen. Nutzergebundener Zugriff über authentifizierte tRPC-Verfahren und die bestehende Manus-Anmeldung. Jeder Datensatz besitzt eine stabile ID; Beziehungen bleiben beim Export erhalten.
- Sofort ausprobierbarer, klar gekennzeichneter lokaler Demomodus mit fiktiven Kunden. Er ist von der echten Datenbank getrennt und kein Authentifizierungs-Bypass. Datensätze bleiben lokal durch AsyncStorage erhalten. Kein automatisches Überschreiben oder Übertragen von Demo-Kundendaten in die Datenbank.
- Kunden: Name und Telefonnummer erforderlich, E-Mail und Notizen optional. Mehrere Fahrzeuge je Kunde, Kennzeichen/Marke/Modell erforderlich, weitere Fahrzeugdetails optional.
- Aufträge: vorhandenen Kunden suchen, Fahrzeug auswählen, Leistungen/Schäden dokumentieren, mehrere frei benennbare Messwerte mit Wert und Einheit; Eingangsdatum und Deadline als validierte Kalenderdaten. Status Neu/In Arbeit/Fertig. Fertigstellungsdatum bei Fertig erforderlich. Negative Geldbeträge nicht zulässig. Geld intern als Cent-Ganzzahlen, deutschsprachige Anzeige in EUR. Alle Beträge einheitlich, keine steuerliche Brutto-/Nettokalkulation.
- JSON exportiert die drei relationalen Datensammlungen; CSV exportiert eine flache Auftragstabelle mit Kunden-/Fahrzeugangaben; SQL exportiert ein eigenständiges MySQL-Schema mit Fremdschlüsseln und korrekt escaped INSERTs. Keine automatische Verbindung zu einer fremden SQL-Datenbank. Web-Dateidownload und natives Teilen des Exporttextes hinter Plattformgrenzen.
- SQL-Modus benötigt Anmeldung und Netzwerk. Demo ist lokal und funktioniert ohne Anmeldung. Datenbankfehler werden sichtbar; keine erfolgreiche Speicherung vortäuschen.
- Metro auf 8081, API auf 3000; Datenbankmigrationen vor der ersten API-Nutzung. Keine Veröffentlichung und kein APK-/App-Store-Build in diesem Auftrag.

## Projektstruktur
- `app/`: Expo-Router-Einstieg und bestehender OAuth-Callback.
- `components/workshop/`: Shell, UI-Bausteine, Bereiche, Formulare und Detailansichten.
- `hooks/use-workshop.ts`: Zustand, lokaler Demodatenspeicher und authentifizierter SQL-Modus.
- `shared/workshop.ts`: Datentypen, Zod-Validierung, Datums-/Geldregeln, Exportgeneratoren.
- `lib/demo-data.ts`: ausschließlich fiktive Beispieldaten.
- `lib/download.web.ts` / `lib/download.ts`: plattformabhängiger Download bzw. Teilen.
- `server/workshop-router.ts`: nutzergebundene CRUD-Schnittstelle, Beziehungsprüfung.
- `drizzle/schema.ts` und generierte Migration: Kunden, Fahrzeuge, Aufträge neben unverändertem Nutzerstamm.
- `tests/workshop.test.ts`: fokussierte deterministische Prüfungen für Validierung, Exporte und Kernregeln.

## Gestaltungswahl
Drei Alternativen: Industrie-Editorial mit Sicherheitsorange (0,07); monochromes Werkstatt-Terminal (0,04); helle technische Karteikarte mit Kobaltblau (0,06). Gewählt: Industrie-Editorial.

- **Design Movement:** Zeitgenössischer Schweizer Funktionalismus mit industrieller Beschilderung.
- **Core Principles:** klare Hierarchie, zurückhaltende Flächen, messbare Informationen, einhändige mobile Bedienung.
- **Color Philosophy:** warmes Hellgrau für Arbeitsruhe, Graphit für Navigation, kräftiges Werkstattorange für wichtigste Aktionen; Rot nur für überfällige Termine und Grün für Fertigstellung.
- **Layout Paradigm:** asymmetrische Arbeitsfläche mit schmaler dunkler Navigation, breitem Hauptbereich und schmaler Terminspalte; mobil linearer Informationsfluss.
- **Signature Elements:** orange Werkzeugmarke, Kennzeichen-Plaketten, feine technische Trennlinien und kleine Großbuchstaben-Labels.
- **Interaction Philosophy:** sichtbare Aktionen, Suchauswahl statt Doppeleingabe, verständliche Fehler direkt am Formular und klare Speicherbestätigung.
- **Animation:** kurze Press-Opacity und 180-ms-Modalüberblendung; keine dekorativen Schleifen oder aufwendigen Bewegungen.
- **Typography System:** native System-Sans (SF Pro/Roboto, Web system-ui); kräftige Titel, ruhiger Fließtext, tabellarische Zahlen und monospace Kennzeichen/IDs.
- **Brand Essence:** AuftragFix bündelt den Werkstattalltag von der Kundenkartei bis zum SQL-Export; präzise, praktisch, verlässlich.
- **Brand Voice:** knapp und konkret: „Alles im Blick.“, „Auftrag speichern“.
- **Wordmark & Logo:** kompakte offene Werkzeug-/A-Marke, weiß auf Graphit mit orangefarbigem Akzent, neben dem Namen AuftragFix.
- **Signature Brand Color:** Werkstattorange #F36A32.

## Erweiterung: Ersatzteilkalkulation

Aufträge erhalten mehrere Ersatzteilpositionen mit Bezeichnung, ganzzahliger Menge (Standard 1), Einkaufspreis pro Stück und Verkaufspreis pro Stück. Positionen lassen sich hinzufügen, bearbeiten und entfernen. Geld bleibt als ganze Cent gespeichert.

Gesamtkosten = Summe(Menge × Teile-Einkaufspreis) + weitere eigene Kosten. Gesamtpreis = Summe(Menge × Teile-Verkaufspreis) + Arbeitslohn/weitere Leistungen. Beide Summen und die Differenz werden live und beim serverseitigen Speichern aus den Positionen neu berechnet; übermittelte Summen sind nicht maßgeblich. Ungültige Mengen, negative Beträge und zu große Summen werden abgewiesen.

Vorhandene Aufträge werden nicht überschrieben: fehlen die neuen Angaben, bleiben ihre bisherigen Kosten/Preise als Basisbeträge erhalten; Ersatzteile starten leer. Für die Aufteilung eines alten Gesamtbetrags muss der entsprechende Basisbetrag angepasst werden, um Doppelzählungen zu vermeiden. Die lokale Normalisierung bewahrt IDs und alle bisherigen Daten. MySQL erhält ausschließlich additive, nullable Spalten für Positionen, weitere Kosten und Leistungsverkaufspreis. Auftragsdetails, Übersicht und Exporte verwenden dieselben automatisch berechneten Gesamtsummen. SQL und JSON enthalten sämtliche Positionen mit Mengen und Einzelpreisen; CSV erhält die Positionen als JSON-Feld sowie Teile- und Basis-Zwischensummen. Export-Schemaversion wird auf 2 erhöht.

## Erweiterung: Kundenrechnung als PDF

Pro Auftrag öffnet „Rechnung als PDF“ ein Rechnungsformular. Werkstattname/-anschrift, Steuerkennung, Kontakt und optionale Bankdaten können auf dem jeweiligen Gerät gespeichert werden. Kunden erhalten eine optionale, wiederverwendbare Rechnungsadresse in ihrer Kartei (additive nullable MySQL-Spalte, kompatible lokale Normalisierung und Export). Rechnungsnummer, Rechnungsdatum, Leistungsdatum, Empfängeradresse und optionale Zahlungsfrist/Hinweise werden vor dem Download eingegeben bzw. geprüft.

Die Steuerbasis wird nicht stillschweigend angenommen: explizite Wahl „Preise netto“, „Preise brutto“ oder „ohne USt-Ausweis“, bei Steuer zusätzlich expliziter Satz; ohne USt-Ausweis ein frei eingegebener Steuerhinweis. Die Rechnung übernimmt ausschließlich Verkaufspreise, Mengen und Leistungsbeschreibungen aus dem Auftrag. Einkaufspreise, eigene Kosten, Kalkulationsdifferenz, Kundennotizen, Schäden und interne Messwerte erscheinen nicht auf der Kundenrechnung. Alle Beträge werden Cent-genau berechnet. Im Demomodus erscheint dauerhaft eine eindeutige Musterkennzeichnung.

PDF-Erzeugung appseitig mit pdf-lib und eingebetteten vorhandenen Schriftdateien statt eines servergebundenen Typst-CLI-Prozesses: geeignet für den unveränderten Expo-/Web-Stack und ohne Übertragung von Rechnungsinhalten an einen PDF-Dienst. Text und Tabellen werden automatisch auf weitere A4-Seiten umgebrochen. Web lädt eine echte PDF-Datei herunter; native Geräte speichern sie temporär und öffnen den Datei-Teilen-Dialog über Expo FileSystem/Sharing. Ein tatsächlicher nativer Gerätetest bleibt gesondert.

Es gibt keinen automatischen Versand, keine gesetzlich geprüfte Rechnungsfreigabe, keine E-Rechnung, keinen globalen Nummernkreis und kein unveränderbares Rechnungsarchiv. Die manuell gewählte Rechnungsnummer und Steuerangaben müssen vom Nutzer geprüft werden. Werkstattangaben bleiben geräte-/konto- und modusgebunden; die PDF ist nach dem Erstellen selbst aufzubewahren. Ein deutlich als Muster markiertes Beispiel-PDF wird aus ausschließlich fiktiven Daten zur Prüfung erzeugt.
