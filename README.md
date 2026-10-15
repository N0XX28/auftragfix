# AuftragFix

**Mobile Kfz-Werkstatt-App für Kunden, Fahrzeuge, Reparaturaufträge und PDF-Rechnungen.**

AuftragFix ist ein funktionaler React-Native-/Expo-Prototyp. Kundendaten werden einmal erfasst und für spätere Aufträge wiederverwendet. Kunden, Fahrzeuge und Aufträge lassen sich für eine spätere SQL-Datenbankübernahme exportieren.

## Funktionen

- **Dashboard:** aktive Aufträge, heutige und überfällige Deadlines, Auftragsvolumen und Terminübersicht.
- **Kundenkartei:** Namenssuche, Telefonnummer, E-Mail, Rechnungsadresse und zugehörige Fahrzeuge sowie Reparaturhistorie.
- **Aufträge:** Auftragseingang, Deadline, Fertigstellung, Status, Schäden, Leistungen und Messwerte erfassen und bearbeiten.
- **Ersatzteilkalkulation:** mehrere Positionen mit Menge, Einkaufs- und Verkaufspreis; Gesamtkosten, Gesamtpreis und Differenz automatisch in Cent berechnen.
- **PDF-Rechnungen:** Kunden- und Werkstattangaben, Ersatzteil-Verkaufspreise, Leistungen und ausdrücklich gewählte Steuerbasis. Interne Kosten und Einkaufspreise bleiben außerhalb der Rechnung.
- **Datenexport:** MySQL-SQL, JSON und CSV; Kunden-, Fahrzeug- und Auftragsbeziehungen bleiben erhalten.
- **Datenmodi:** lokal gespeicherte, deutlich markierte fiktive Demodaten oder authentifizierter, nutzergebundener SQL-Datenspeicher.

Die vollständige Bedienanleitung steht in [ANLEITUNG.md](ANLEITUNG.md). Eine rein fiktive [Musterrechnung](examples/muster-rechnung.pdf) ist enthalten.

## Technik

Expo Router · React Native · TypeScript · Express · tRPC · Drizzle ORM · MySQL · pdf-lib

```text
app/                    Expo-Routen und Einstieg
components/workshop/    Dashboard, Kunden, Aufträge, Formulare und Rechnungen
hooks/                  Authentifizierung und Werkstatt-Datenverwaltung
shared/                 Datenmodelle, Validierung, Kalkulation und Exporte
lib/                    Demo-Daten, PDF-Erzeugung und plattformabhängige Downloads
server/                 API, SQL-Zugriff und Authentifizierung
drizzle/                Schema und additive SQL-Migrationen
assets/                 App-Symbole und PDF-Schriften mit Schriftlizenz
tests/                  Automatisierte Kern- und Regressionstests
```

## Lokal entwickeln

Voraussetzungen: Node.js 22, der in `package.json` angegebene pnpm-Paketmanager und für den SQL-Modus eine konfigurierte MySQL-Datenbank. Die verwaltete Projektumgebung stellt Datenbank- und Authentifizierungskonfiguration bereit; das GitHub-Repository enthält **keine Zugangsdaten**.

```bash
git clone https://github.com/N0XX28/auftragfix.git
cd auftragfix
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm test
```

Für den lokalen API-/SQL-Betrieb müssen Umgebungsvariablen separat eingerichtet werden, insbesondere:

| Variable | Verwendung |
| --- | --- |
| `DATABASE_URL` | MySQL-Verbindung, nur auf dem Server |
| `MANUS_JWT_SECRET` bzw. `JWT_SECRET` | Session-Signatur, nur auf dem Server |
| `MANUS_PROJECT_ID` bzw. `VITE_APP_ID` | Projektkennung für den vorhandenen Authentifizierungsadapter |
| `MANUS_OAUTH_API_URL` bzw. `OAUTH_SERVER_URL` | OAuth-API für den vorhandenen Anmeldeablauf |
| `EXPO_PUBLIC_API_BASE_URL` | Vom Browser bzw. Gerät erreichbare API-Adresse |
| `EXPO_PUBLIC_OAUTH_PORTAL_URL`, `EXPO_PUBLIC_OAUTH_SERVER_URL`, `EXPO_PUBLIC_APP_ID` | Öffentliche App-/OAuth-Konfiguration |

Servergeheimnisse niemals in `EXPO_PUBLIC_*`-Variablen oder in Git speichern. Ein eigenständiger Betrieb außerhalb der bisherigen Projektumgebung benötigt ein entsprechend eingerichtetes Backend und eine kompatible Authentifizierung; das Klonen überträgt keine Cloud-Datenbank und richtet keinen neuen OAuth-Dienst ein.

Nach der Einrichtung der Umgebung:

```bash
pnpm db:push     # Migrationen auf die konfigurierte Datenbank anwenden
pnpm dev         # API auf Port 3000; Expo/Metro-Web auf Port 8081
```

`pnpm db:push` schreibt in die ausgewählte Datenbank. Dafür nur eine bewusst konfigurierte Entwicklungsdatenbank verwenden. Native Geräte müssen die API über eine erreichbare Adresse ansprechen; `localhost` auf dem Telefon bezeichnet nicht den Entwicklungsrechner.

Weitere Befehle:

```bash
pnpm build
pnpm exec expo export --platform web --output-dir web-build
pnpm exec tsx scripts/generate-invoice-sample.ts
```

## Prüfstand und Grenzen

Zum letzten Implementierungsstand bestehen **68 automatisierte Prüfungen**; ein bestehender Auth-Test ohne Testsession ist übersprungen. TypeScript und Expo-Web-Build wurden geprüft. Der PDF-Importfehler in Expo wurde korrigiert und die tatsächliche PDF-Erzeugung samt Download zusätzlich direkt im Browser geprüft.

- Kein abgeschlossener iOS-/Android-Gerätetest oder App-Store-Release.
- Kein gemeinsamer Mehrbenutzerbetrieb mit Werkstatt-/Teamrollen.
- PDF-Erstellung ohne automatische Kundensendung, globalen Rechnungsnummernkreis, unveränderbares Archiv oder strukturierte E-Rechnung.
- Vor realer Nutzung müssen Steuerangaben, Rechnungsanforderungen, Datenschutz, Zugriff und Sicherungen überprüft werden.

## GitHub-Export

Dieses Repository ist ein **separater Quellcodeexport** des bestehenden Mobile-Projekts. Dessen verwalteter Projektspeicher und Vorschau bleiben unverändert. Eine automatische bidirektionale Synchronisierung mit GitHub ist nicht eingerichtet. Laufzeitdaten, lokale Kundeneinträge, Umgebungsgeheimnisse, installierte Abhängigkeiten und Build-Ausgaben sind nicht Bestandteil des Exports.
