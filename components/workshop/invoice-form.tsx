import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useWorkshop } from "../../hooks/use-workshop";
import {
  calculateInvoiceTotals,
  createInvoiceModel,
  emptyWorkshopProfile,
  invoiceOptionsSchema,
  parseTaxRate,
  taxModes,
  workshopProfileSchema,
  type TaxMode,
  type WorkshopProfile,
} from "../../shared/invoice";
import {
  dateInput,
  localToday,
  money,
  normalizeOrder,
  parseDateInput,
} from "../../shared/workshop";
import { exportInvoicePdf } from "../../lib/invoice-file";
import {
  AlertBox,
  Button,
  C,
  Card,
  Copy,
  Divider,
  Field,
  FormRow,
  Heading,
  Label,
  Panel,
} from "./ui";

export function InvoiceForm({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const w = useWorkshop();
  const stored = w.data.orders.find((o) => o.id === orderId);
  const customer = w.data.customers.find((c) => c.id === stored?.customerId);
  const vehicle = w.data.vehicles.find((v) => v.id === stored?.vehicleId);
  const [profile, setProfile] = useState<WorkshopProfile>(emptyWorkshopProfile);
  const [form, setForm] = useState({
    number: "",
    invoiceDate: dateInput(localToday()),
    serviceDate: dateInput(stored?.completedDate ?? ""),
    recipientAddress: customer?.address ?? "",
    dueDate: "",
    taxMode: "",
    rate: "",
    taxNote: "",
    paymentNote: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const profileKey = `auftragfix-invoice-profile-v1:${w.mode}:${w.mode === "sql" ? (w.user?.id ?? "none") : "demo"}`;
  useEffect(() => {
    let alive = true;
    setLoading(true);
    AsyncStorage.getItem(profileKey)
      .then((raw) => {
        if (!alive) return;
        if (raw) {
          const result = workshopProfileSchema.safeParse(JSON.parse(raw));
          if (result.success) setProfile(result.data);
        }
      })
      .catch(() => {
        if (alive)
          setFailure(
            "Gespeicherte Werkstattangaben konnten nicht geladen werden. Bitte neu eingeben.",
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [profileKey]);
  if (!stored || !customer || !vehicle) return null;
  const order = normalizeOrder(stored);
  const set = (field: keyof typeof form, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setSuccess(false);
  };
  const setWorkshop = (field: keyof WorkshopProfile, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
    setSuccess(false);
  };
  const rate = form.taxMode === "none" ? 0 : parseTaxRate(form.rate);
  const selected = taxModes.includes(form.taxMode as TaxMode);
  const totals =
    selected && Number.isFinite(rate)
      ? calculateInvoiceTotals(order.priceCents, form.taxMode as TaxMode, rate)
      : null;
  function demo() {
    setProfile({
      name: "Musterwerkstatt Beispiel",
      address: "Beispielstraße 12\n12345 Musterstadt",
      contact: "werkstatt@example.com",
      taxIdentifier: "MUSTER – keine gültige Steuerkennung",
      iban: "",
      bic: "",
    });
    setForm((p) => ({
      ...p,
      number: `MUSTER-${order.number}`,
      recipientAddress: "Musterweg 3\n12345 Musterstadt",
      serviceDate: dateInput(localToday()),
      taxMode: "gross",
      rate: "19",
      paymentNote: "Musterrechnung – keine Zahlungsaufforderung.",
    }));
    setErrors({});
    setFailure("");
    setSuccess(false);
  }
  async function generate() {
    if (!customer || !vehicle) return;
    const p = workshopProfileSchema.safeParse(profile);
    const opts = invoiceOptionsSchema.safeParse({
      ...form,
      invoiceDate: parseDateInput(form.invoiceDate),
      serviceDate: parseDateInput(form.serviceDate),
      dueDate: parseDateInput(form.dueDate),
      rateBasisPoints: rate,
    });
    const next: Record<string, string> = {};
    if (!p.success)
      p.error.issues.forEach((i) => {
        next[`profile.${String(i.path[0])}`] = i.message;
      });
    if (!opts.success)
      opts.error.issues.forEach((i) => {
        next[String(i.path[0])] = i.message;
      });
    if (!selected) next.taxMode = "Bitte die Preis- und Steuerbasis auswählen.";
    if (!Number.isFinite(rate))
      next.rateBasisPoints = "Bitte den Steuersatz eingeben, z. B. 19 oder 7.";
    if (Object.keys(next).length || !p.success || !opts.success) {
      setErrors(next);
      setFailure("Bitte die markierten Rechnungsangaben prüfen.");
      return;
    }
    setErrors({});
    setFailure("");
    setSuccess(false);
    setGenerating(true);
    try {
      const model = createInvoiceModel(
        order,
        customer,
        vehicle,
        p.data,
        opts.data,
        w.mode === "demo",
      );
      await exportInvoicePdf(model);
      setSuccess(true);
      w.notify("Rechnungs-PDF bereitgestellt");
      try {
        await AsyncStorage.setItem(profileKey, JSON.stringify(p.data));
      } catch {
        setFailure(
          "PDF erstellt; Werkstattangaben konnten aber nicht für das nächste Mal gespeichert werden.",
        );
      }
    } catch (e) {
      setFailure(
        e instanceof Error ? e.message : "PDF konnte nicht erstellt werden.",
      );
    } finally {
      setGenerating(false);
    }
  }
  return (
    <Panel
      title="Rechnung als PDF"
      subtitle={`${order.number} · ${customer.name}`}
      onClose={onClose}
      footer={
        <>
          <Button
            label="Zurück"
            variant="secondary"
            disabled={generating}
            onPress={onClose}
          />
          <Button
            label={
              generating ? "PDF wird erstellt …" : "PDF herunterladen / teilen"
            }
            icon="download"
            disabled={loading || generating || !w.ready}
            onPress={() => void generate()}
          />
        </>
      }
    >
      {!!failure && <AlertBox tone="error">{failure}</AlertBox>}
      {success && (
        <AlertBox>
          PDF bereitgestellt. Die Datei wurde nicht automatisch an den Kunden
          versandt.
        </AlertBox>
      )}
      {w.mode === "demo" && (
        <View style={{ gap: 10 }}>
          <AlertBox>
            Demomodus: Jede PDF ist sichtbar als Muster gekennzeichnet und nicht
            als echte Rechnung bestimmt.
          </AlertBox>
          <Button
            label="Fiktives Demobeispiel laden"
            icon="file-text"
            compact
            variant="secondary"
            onPress={demo}
            disabled={loading || generating}
          />
        </View>
      )}
      <Label>01 / Ihre Werkstatt</Label>
      <Copy>
        Diese Angaben werden nach dem Erstellen auf diesem Gerät gespeichert,
        getrennt nach Datenmodus und angemeldetem Konto.
      </Copy>
      <Field
        label="Werkstattname *"
        value={profile.name}
        onChangeText={(v) => setWorkshop("name", v)}
        error={errors["profile.name"]}
        placeholder="Firma / Inhaber"
        editable={!loading && !generating}
      />
      <Field
        label="Werkstattanschrift *"
        value={profile.address}
        onChangeText={(v) => setWorkshop("address", v)}
        error={errors["profile.address"]}
        multiline
        placeholder="Straße, Hausnummer, PLZ und Ort"
        editable={!loading && !generating}
      />
      <Field
        label="Kontakt (Telefon / E-Mail)"
        value={profile.contact}
        onChangeText={(v) => setWorkshop("contact", v)}
        error={errors["profile.contact"]}
        editable={!loading && !generating}
      />
      <Field
        label="Steuernummer / USt-IdNr."
        value={profile.taxIdentifier}
        onChangeText={(v) => setWorkshop("taxIdentifier", v)}
        error={errors["profile.taxIdentifier"]}
        placeholder="Ihre tatsächliche Steuerkennung"
        editable={!loading && !generating}
      />
      <Divider />
      <Label>02 / Empfänger & Rechnungsdaten</Label>
      <Heading size={17}>{customer.name}</Heading>
      <Copy>{customer.phone}</Copy>
      <Field
        label="Kundenanschrift *"
        value={form.recipientAddress}
        onChangeText={(v) => set("recipientAddress", v)}
        error={errors.recipientAddress}
        multiline
        placeholder="Straße, Hausnummer, PLZ und Ort"
      />
      <Copy>
        Die wiederverwendbare Rechnungsadresse können Sie in der Kundenkartei
        speichern. Änderungen hier betreffen nur diese PDF.
      </Copy>
      <Field
        label="Rechnungsnummer *"
        value={form.number}
        onChangeText={(v) => set("number", v)}
        error={errors.number}
        placeholder="z. B. RE-2026-001"
      />
      <Copy>
        Bitte eine eindeutige eigene Nummer verwenden. Die App verwaltet noch
        keinen globalen Rechnungsnummernkreis.
      </Copy>
      <FormRow>
        <Field
          label="Rechnungsdatum *"
          value={form.invoiceDate}
          onChangeText={(v) => set("invoiceDate", v)}
          error={errors.invoiceDate}
          placeholder="TT.MM.JJJJ"
        />
        <Field
          label="Leistungsdatum *"
          value={form.serviceDate}
          onChangeText={(v) => set("serviceDate", v)}
          error={errors.serviceDate}
          placeholder="TT.MM.JJJJ"
        />
      </FormRow>
      <Field
        label="Zahlungsfrist (optional)"
        value={form.dueDate}
        onChangeText={(v) => set("dueDate", v)}
        error={errors.dueDate}
        placeholder="TT.MM.JJJJ"
      />
      <Divider />
      <Label>03 / Preisbasis & Steuer</Label>
      <Copy>
        Die Auftragspreise werden nicht geändert. Wählen Sie bewusst, wie die
        gespeicherten Verkaufspreise auf der Rechnung behandelt werden.
      </Copy>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {(
          [
            ["net", "Preise netto"],
            ["gross", "Preise brutto"],
            ["none", "Ohne USt-Ausweis"],
          ] as const
        ).map(([mode, label]) => (
          <Button
            key={mode}
            label={label}
            compact
            variant={form.taxMode === mode ? "primary" : "secondary"}
            onPress={() => set("taxMode", mode)}
            disabled={generating}
          />
        ))}
      </View>
      {!!errors.taxMode && <Copy color={C.red}>{errors.taxMode}</Copy>}
      {form.taxMode !== "none" && (
        <>
          <Field
            label="Umsatzsteuersatz (%) *"
            value={form.rate}
            onChangeText={(v) => set("rate", v)}
            error={errors.rateBasisPoints}
            keyboardType="decimal-pad"
            placeholder="Steuersatz bewusst wählen"
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {["19", "7", "0"].map((value) => (
              <Button
                key={value}
                label={`${value} %`}
                compact
                variant="secondary"
                onPress={() => set("rate", value)}
                disabled={generating}
              />
            ))}
          </View>
        </>
      )}
      <Field
        label={
          form.taxMode === "none"
            ? "Ihr Hinweis zum fehlenden USt-Ausweis *"
            : "Steuerhinweis (optional)"
        }
        value={form.taxNote}
        onChangeText={(v) => set("taxNote", v)}
        error={errors.taxNote}
        multiline
        placeholder="Nur einen für Ihre Werkstatt zutreffenden Hinweis verwenden"
      />
      <Card style={{ padding: 16, gap: 12 }}>
        <Label>Rechnungsbetrag</Label>
        <Copy>Auftrags-Verkaufspreise: {money(order.priceCents)}</Copy>
        {totals ? (
          <>
            <Copy>
              {form.taxMode === "none" ? "Summe" : "Nettobetrag"}:{" "}
              {money(totals.netCents)}
            </Copy>
            {form.taxMode !== "none" && (
              <Copy>Umsatzsteuer: {money(totals.taxCents)}</Copy>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Text style={{ color: C.orange, fontWeight: "700" }}>
                Gesamtbetrag
              </Text>
              <Heading size={23}>{money(totals.totalCents)}</Heading>
            </View>
          </>
        ) : (
          <Copy>Bitte zuerst Preisbasis und Steuersatz auswählen.</Copy>
        )}
      </Card>
      <Divider />
      <Label>04 / Zahlung & Hinweise</Label>
      <FormRow>
        <Field
          label="IBAN (optional)"
          value={profile.iban}
          onChangeText={(v) => setWorkshop("iban", v)}
          error={errors["profile.iban"]}
        />
        <Field
          label="BIC (optional)"
          value={profile.bic}
          onChangeText={(v) => setWorkshop("bic", v)}
          error={errors["profile.bic"]}
        />
      </FormRow>
      <Field
        label="Zahlungs- / Kundenhinweis"
        value={form.paymentNote}
        onChangeText={(v) => set("paymentNote", v)}
        error={errors.paymentNote}
        multiline
        placeholder="Optionaler Hinweis für den Kunden"
      />
      <Copy>
        Die Kundenrechnung enthält ausschließlich Verkaufspreise und Leistungen
        – keine Einkaufspreise, eigenen Kosten, Kalkulationsdifferenz oder
        internen Notizen. Bitte Steuerangaben, Nummer und Inhalt prüfen. Kein
        automatischer Versand, keine E-Rechnung und kein unveränderbares
        Rechnungsarchiv.
      </Copy>
    </Panel>
  );
}
