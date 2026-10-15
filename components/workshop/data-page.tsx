import { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { useWorkshop } from "../../hooks/use-workshop";
import { downloadText } from "../../lib/download";
import {
  csvExport,
  jsonExport,
  localToday,
  sqlExport,
} from "../../shared/workshop";
import {
  AlertBox,
  Button,
  C,
  Card,
  Copy,
  Divider,
  Heading,
  Icon,
  Label,
  Panel,
  type IconName,
} from "./ui";

type Format = "sql" | "json" | "csv";
const formats: {
  key: Format;
  title: string;
  subtitle: string;
  description: string;
  icon: IconName;
  mime: string;
}[] = [
  {
    key: "sql",
    title: "SQL",
    subtitle: "Für Ihre Datenbank",
    description:
      "MySQL-8-Schema und INSERT-Anweisungen mit verknüpften Kunden, Fahrzeugen und Aufträgen.",
    icon: "database",
    mime: "application/sql",
  },
  {
    key: "json",
    title: "JSON",
    subtitle: "Vollständig & strukturiert",
    description:
      "Alle drei Datensammlungen mit stabilen IDs und Beziehungen. Ideal für eigene Importschnittstellen.",
    icon: "code",
    mime: "application/json",
  },
  {
    key: "csv",
    title: "CSV",
    subtitle: "Für Excel & Tabellen",
    description:
      "Auftragsliste inklusive Kunden- und Fahrzeugangaben. Semikolon-getrennt und Excel-kompatibel.",
    icon: "grid",
    mime: "text/csv",
  },
];
export function DataPage() {
  const w = useWorkshop();
  const [preview, setPreview] = useState<Format | null>(null);
  const [lastExport, setLastExport] = useState("");
  const [exporting, setExporting] = useState(false);
  const source = (f: Format) =>
    f === "sql"
      ? sqlExport(w.data)
      : f === "json"
        ? jsonExport(w.data)
        : csvExport(w.data);
  async function exportFile(f: Format) {
    setExporting(true);
    try {
      await downloadText(
        `auftragfix-${w.mode}-${localToday()}.${f}`,
        source(f),
        formats.find((x) => x.key === f)!.mime,
      );
      setLastExport(
        new Date().toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      w.notify(
        Platform.OS === "web"
          ? "Exportdatei bereitgestellt"
          : "Export zum Teilen bereitgestellt",
      );
    } catch {
      w.notify("Export konnte nicht erstellt werden. Bitte erneut versuchen.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 7 }}>
        <Heading size={30}>Ihre Daten. Ihr Export.</Heading>
        <Copy>Sauber strukturiert und bereit für den nächsten Schritt.</Copy>
      </View>
      <Card style={{ padding: 23, gap: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
          <View
            style={{
              backgroundColor: C.orangeLight,
              padding: 11,
              borderRadius: 10,
            }}
          >
            <Icon name="hard-drive" color={C.orange} size={23} />
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Heading size={18}>Datenspeicher</Heading>
            <Copy>
              {w.mode === "demo"
                ? "Demomodus · lokal auf diesem Gerät"
                : "Privater MySQL-Datenspeicher"}
            </Copy>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 9, flexWrap: "wrap" }}>
          <Button
            label="Demo (lokal)"
            icon="smartphone"
            variant={w.mode === "demo" ? "primary" : "secondary"}
            disabled={w.saving}
            onPress={() => void w.selectMode("demo")}
          />
          <Button
            label={
              w.user
                ? "Private SQL-Datenbank"
                : "Anmelden & SQL-Datenbank nutzen"
            }
            icon="lock"
            variant={w.mode === "sql" ? "primary" : "secondary"}
            disabled={w.saving}
            onPress={() => void w.selectMode("sql")}
          />
          {w.user && (
            <Button
              label="Abmelden"
              compact
              variant="ghost"
              onPress={() => void w.logout()}
            />
          )}
        </View>
        <Copy>
          {w.mode === "demo"
            ? "Fiktive Beispieldaten. Änderungen bleiben lokal gespeichert und werden nicht automatisch in die SQL-Datenbank übernommen."
            : `Daten sind an Ihr angemeldetes Konto gebunden${w.user?.name ? ` (${w.user.name})` : ""}. Netzwerkverbindung erforderlich. Demodaten bleiben getrennt.`}
        </Copy>
        {w.mode === "sql" && !w.user && !w.authLoading && (
          <AlertBox>
            Bitte anmelden, um die privaten Datensätze zu laden. Der lokale
            Demomodus bleibt verfügbar.
          </AlertBox>
        )}
        <Divider />
        <View style={{ flexDirection: "row", gap: 30, flexWrap: "wrap" }}>
          {[
            ["Kunden", w.data.customers.length],
            ["Fahrzeuge", w.data.vehicles.length],
            ["Aufträge", w.data.orders.length],
          ].map(([label, value]) => (
            <View key={label} style={{ gap: 7 }}>
              <Text style={{ color: C.ink, fontWeight: "700", fontSize: 27 }}>
                {value}
              </Text>
              <Label>{label}</Label>
            </View>
          ))}
        </View>
      </Card>
      <View style={{ gap: 8 }}>
        <Heading size={19}>Exportformat wählen</Heading>
        <Copy>Der Export enthält den aktuell ausgewählten Datenspeicher.</Copy>
      </View>
      <View style={{ flexDirection: "row", gap: 15, flexWrap: "wrap" }}>
        {formats.map((f) => (
          <Card
            key={f.key}
            style={{ flexGrow: 1, flexBasis: 240, padding: 22, gap: 16 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{ backgroundColor: C.bg, padding: 11, borderRadius: 10 }}
              >
                <Icon name={f.icon} color={C.ink} size={25} />
              </View>
              {f.key === "sql" && (
                <View
                  style={{
                    backgroundColor: C.greenLight,
                    padding: 7,
                    borderRadius: 5,
                  }}
                >
                  <Text
                    style={{ color: C.green, fontSize: 9, fontWeight: "600" }}
                  >
                    SQL-IMPORT
                  </Text>
                </View>
              )}
            </View>
            <Heading size={26}>{f.title}</Heading>
            <Text style={{ color: C.ink, fontSize: 13, fontWeight: "600" }}>
              {f.subtitle}
            </Text>
            <Text
              style={{
                color: C.muted,
                fontSize: 12,
                lineHeight: 20,
                minHeight: 60,
              }}
            >
              {f.description}
            </Text>
            <Button
              label={
                Platform.OS === "web"
                  ? `${f.title} exportieren`
                  : `${f.title} teilen`
              }
              icon="download"
              onPress={() => void exportFile(f.key)}
              disabled={!w.ready || exporting}
            />
            <Button
              label="Vorschau ansehen"
              icon="eye"
              compact
              variant="ghost"
              onPress={() => setPreview(f.key)}
              disabled={!w.ready}
            />
          </Card>
        ))}
      </View>
      <AlertBox>
        SQL-Export ist für MySQL 8 ausgelegt. In eine neue oder leere
        Zieldatenbank importieren; vorhandene IDs werden nicht überschrieben.
        JSON eignet sich zur Anpassung an andere SQL-Systeme. CSV enthält nur
        Aufträge – Kunden ohne Auftrag sind im SQL-/JSON-Export enthalten.
      </AlertBox>
      <Card style={{ padding: 20, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Icon name="shield" color={C.green} size={18} />
          <Heading size={16}>Verknüpfungen bleiben erhalten.</Heading>
        </View>
        <Copy>
          Kunde → Fahrzeug → Auftrag. Telefonnummer, Fahrzeugdetails und
          Reparaturhistorie sind über stabile IDs verbunden. Geldwerte im SQL-
          und JSON-Export werden exakt in Cent gespeichert.
        </Copy>
        <Copy>
          Exportdateien enthalten personenbezogene Daten. Bewahren Sie sie
          sicher auf und teilen Sie sie nur mit berechtigten Personen.
        </Copy>
        {!!lastExport && (
          <Text style={{ color: C.green, fontSize: 12 }}>
            Zuletzt bereitgestellt um {lastExport} Uhr.
          </Text>
        )}
      </Card>
      {preview && (
        <Panel
          title={`${preview.toUpperCase()}-Exportvorschau`}
          subtitle="Die Exportdatei enthält immer den vollständigen Datensatz."
          onClose={() => setPreview(null)}
          footer={
            <Button
              label={
                Platform.OS === "web" ? "Datei herunterladen" : "Export teilen"
              }
              icon="download"
              disabled={exporting}
              onPress={() => void exportFile(preview)}
            />
          }
        >
          <ScrollView horizontal>
            <Text
              selectable
              style={{
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                fontSize: 11,
                lineHeight: 18,
                color: C.ink,
              }}
            >
              {source(preview).slice(0, 12000)}
              {source(preview).length > 12000
                ? "\n… Vorschau gekürzt. Datei enthält alle Daten."
                : ""}
            </Text>
          </ScrollView>
        </Panel>
      )}
    </View>
  );
}
