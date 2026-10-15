import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useWorkshop } from "../../hooks/use-workshop";
import {
  calculateOrderTotals,
  dateInput,
  localToday,
  moneyInput,
  newId,
  normalizeOrder,
  orderSchema,
  parseDateInput,
  parseMoney,
  statusLabels,
  statuses,
  type Customer,
  type Order,
} from "../../shared/workshop";
import { CustomerForm, VehicleForm } from "./customer-forms";
import { draftToPart, partToDraft } from "../../shared/parts-form";
import { PartsEditor } from "./parts-editor";
import { PricingSummary } from "./pricing-summary";
import {
  AlertBox,
  Avatar,
  Button,
  C,
  Divider,
  Field,
  FormRow,
  Heading,
  Icon,
  Label,
  Panel,
  Plate,
  Search,
} from "./ui";

export function OrderForm({
  order,
  customerId,
  onClose,
  onSaved,
}: {
  order?: Order;
  customerId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data, saveOrder, saving } = useWorkshop();
  const [form, setForm] = useState<Order>(() => {
    const id = newId();
    const c = customerId ?? "";
    return order
      ? normalizeOrder(order)
      : {
          id,
          customerId: c,
          vehicleId: data.vehicles.find((v) => v.customerId === c)?.id ?? "",
          number: `AF-${localToday().slice(0, 4)}-${id.slice(0, 6).toUpperCase()}`,
          title: "",
          receivedDate: localToday(),
          deadline: localToday(),
          completedDate: "",
          status: "new",
          damages: "",
          services: "",
          measurements: [],
          parts: [],
          otherCostCents: 0,
          servicePriceCents: 0,
          costCents: 0,
          priceCents: 0,
        };
  });
  const [received, setReceived] = useState(dateInput(form.receivedDate));
  const [deadline, setDeadline] = useState(dateInput(form.deadline));
  const [completed, setCompleted] = useState(dateInput(form.completedDate));
  const [cost, setCost] = useState(
    order ? moneyInput(form.otherCostCents) : "",
  );
  const [price, setPrice] = useState(
    order ? moneyInput(form.servicePriceCents) : "",
  );
  const [parts, setParts] = useState(() => form.parts.map(partToDraft));
  const [query, setQuery] = useState("");
  const [pickCustomer, setPickCustomer] = useState(!form.customerId);
  const [addCustomer, setAddCustomer] = useState(false);
  const [addVehicle, setAddVehicle] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const customer = data.customers.find((c) => c.id === form.customerId);
  const vehicles = data.vehicles.filter(
    (v) => v.customerId === form.customerId,
  );
  const matches = data.customers
    .filter((c) =>
      `${c.name} ${c.phone}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 10);
  const choose = (c: Customer) => {
    setForm((p) => ({
      ...p,
      customerId: c.id,
      vehicleId: data.vehicles.find((v) => v.customerId === c.id)?.id ?? "",
    }));
    setPickCustomer(false);
    setQuery("");
  };
  const liveCost = parseMoney(cost),
    livePrice = parseMoney(price);
  const liveParts = parts.map(draftToPart);
  const totals = calculateOrderTotals(liveParts, liveCost, livePrice);
  const validQuantities = liveParts.every(
    (p) =>
      Number.isInteger(p.quantity) && p.quantity >= 1 && p.quantity <= 9999,
  );
  async function submit() {
    const value = {
      ...form,
      receivedDate: parseDateInput(received),
      deadline: parseDateInput(deadline),
      completedDate: parseDateInput(completed),
      parts: liveParts,
      otherCostCents: liveCost,
      servicePriceCents: livePrice,
      costCents: 0,
      priceCents: 0,
    };
    const result = orderSchema.safeParse(value);
    const nextErrors: Record<string, string> = {};
    if (!value.customerId)
      nextErrors.customerId = "Bitte einen Kunden auswählen.";
    if (!value.vehicleId)
      nextErrors.vehicleId = "Bitte ein Fahrzeug auswählen oder hinzufügen.";
    if (!result.success)
      result.error.issues.forEach((i) => {
        nextErrors[
          i.path[0] === "parts" ? i.path.join(".") : String(i.path[0])
        ] = i.message;
      });
    if (!Number.isFinite(liveCost))
      nextErrors.otherCostCents =
        "Bitte einen gültigen Betrag eingeben, z. B. 123,45.";
    if (!Number.isFinite(livePrice))
      nextErrors.servicePriceCents =
        "Bitte einen gültigen Betrag eingeben, z. B. 123,45.";
    liveParts.forEach((p, i) => {
      if (!Number.isFinite(p.purchaseCents))
        nextErrors[`parts.${i}.purchaseCents`] =
          "Bitte einen gültigen Einkaufspreis eingeben.";
      if (!Number.isFinite(p.saleCents))
        nextErrors[`parts.${i}.saleCents`] =
          "Bitte einen gültigen Verkaufspreis eingeben.";
      if (!Number.isFinite(p.quantity))
        nextErrors[`parts.${i}.quantity`] =
          "Bitte eine ganze Menge ab 1 eingeben.";
    });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setFailure("Bitte die markierten Angaben prüfen.");
      return;
    }
    setErrors({});
    setFailure("");
    try {
      await saveOrder(result.success ? result.data : value);
      onSaved();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    }
  }
  if (addCustomer)
    return (
      <CustomerForm
        onClose={() => setAddCustomer(false)}
        onSaved={(c) => {
          choose(c);
          setAddCustomer(false);
        }}
      />
    );
  if (addVehicle && customer)
    return (
      <VehicleForm
        customer={customer}
        onClose={() => setAddVehicle(false)}
        onSaved={(v) => {
          setForm((p) => ({ ...p, vehicleId: v.id }));
          setAddVehicle(false);
        }}
      />
    );
  return (
    <Panel
      title={order ? "Auftrag bearbeiten" : "Neuer Auftrag"}
      subtitle={`${form.number} · alle Angaben an einem Ort`}
      onClose={onClose}
      footer={
        <>
          <Button
            label="Abbrechen"
            variant="secondary"
            onPress={onClose}
            disabled={saving}
          />
          <Button
            label={saving ? "Wird gespeichert …" : "Auftrag speichern"}
            icon="check"
            onPress={() => void submit()}
            disabled={saving}
          />
        </>
      }
    >
      {failure ? <AlertBox tone="error">{failure}</AlertBox> : null}
      <View style={{ gap: 12 }}>
        <Label>01 / Kunde & Fahrzeug</Label>
        {customer && !pickCustomer ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 13,
              backgroundColor: C.bg,
              borderRadius: 9,
            }}
          >
            <Avatar name={customer.name} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.ink, fontWeight: "600", fontSize: 15 }}>
                {customer.name}
              </Text>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {customer.phone}
              </Text>
            </View>
            <Button
              label="Ändern"
              variant="ghost"
              compact
              onPress={() => setPickCustomer(true)}
            />
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Search
              value={query}
              onChange={setQuery}
              placeholder="Vorhandenen Kunden suchen …"
            />
            <View
              style={{
                borderWidth: 1,
                borderColor: C.line,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {matches.map((c) => (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name} auswählen`}
                  onPress={() => choose(c)}
                  style={{
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 11,
                    borderBottomWidth: 1,
                    borderBottomColor: C.line,
                  }}
                >
                  <Avatar name={c.name} size={30} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.ink, fontWeight: "600" }}>
                      {c.name}
                    </Text>
                    <Text
                      style={{ color: C.muted, fontSize: 11, marginTop: 3 }}
                    >
                      {c.phone}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={15} />
                </Pressable>
              ))}
              {!matches.length && (
                <Text style={{ color: C.muted, padding: 13 }}>
                  Kein Kunde gefunden.
                </Text>
              )}
            </View>
            <Button
              label="Neuen Kunden anlegen"
              variant="secondary"
              icon="user-plus"
              onPress={() => setAddCustomer(true)}
            />
          </View>
        )}
        {errors.customerId && (
          <Text style={{ color: C.red, fontSize: 12 }}>
            {errors.customerId}
          </Text>
        )}
        {customer && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", color: C.ink, fontSize: 13 }}>
              Fahrzeug *
            </Text>
            {vehicles.map((v) => (
              <Pressable
                key={v.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: form.vehicleId === v.id }}
                onPress={() => setForm((p) => ({ ...p, vehicleId: v.id }))}
                style={{
                  borderWidth: 1,
                  borderColor: form.vehicleId === v.id ? C.orange : C.line,
                  backgroundColor:
                    form.vehicleId === v.id ? C.orangeLight : C.paper,
                  borderRadius: 9,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon
                  name={form.vehicleId === v.id ? "check-circle" : "circle"}
                  color={form.vehicleId === v.id ? C.orange : C.muted}
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{ color: C.ink, fontWeight: "600", fontSize: 13 }}
                  >
                    {v.make} {v.model}
                  </Text>
                  <Plate plate={v.plate} />
                </View>
              </Pressable>
            ))}
            <Button
              label="Fahrzeug hinzufügen"
              icon="plus"
              compact
              variant="ghost"
              onPress={() => setAddVehicle(true)}
            />
            {errors.vehicleId && (
              <Text style={{ color: C.red, fontSize: 12 }}>
                {errors.vehicleId}
              </Text>
            )}
          </View>
        )}
      </View>
      <Divider />
      <View style={{ gap: 14 }}>
        <Label>02 / Auftrag & Termine</Label>
        <Field
          label="Auftragsbezeichnung *"
          value={form.title}
          onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
          placeholder="z. B. Bremsen & Inspektion"
          error={errors.title}
        />
        <FormRow>
          <Field
            label="Auftragseingang *"
            value={received}
            onChangeText={setReceived}
            placeholder="TT.MM.JJJJ"
            error={errors.receivedDate}
            keyboardType="numbers-and-punctuation"
          />
          <Field
            label="Deadline *"
            value={deadline}
            onChangeText={setDeadline}
            placeholder="TT.MM.JJJJ"
            error={errors.deadline}
            keyboardType="numbers-and-punctuation"
          />
        </FormRow>
        <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}>
          {statuses.map((status) => (
            <Button
              key={status}
              label={statusLabels[status]}
              variant={form.status === status ? "primary" : "secondary"}
              compact
              onPress={() => {
                setForm((p) => ({ ...p, status }));
                if (status === "done" && !completed)
                  setCompleted(dateInput(localToday()));
              }}
            />
          ))}
        </View>
        <Field
          label={`Fertigstellungsdatum${form.status === "done" ? " *" : " (optional)"}`}
          value={completed}
          onChangeText={setCompleted}
          placeholder="TT.MM.JJJJ"
          error={errors.completedDate}
        />
      </View>
      <Divider />
      <View style={{ gap: 14 }}>
        <Label>03 / Arbeiten & Dokumentation</Label>
        <Field
          label="Schäden / Befund"
          value={form.damages}
          onChangeText={(v) => setForm((p) => ({ ...p, damages: v }))}
          multiline
          placeholder="Was wurde festgestellt?"
        />
        <Field
          label="Leistungen *"
          value={form.services}
          onChangeText={(v) => setForm((p) => ({ ...p, services: v }))}
          multiline
          placeholder="Arbeiten beschreiben, gerne eine Leistung pro Zeile"
          error={errors.services}
        />
        <Text style={{ color: C.ink, fontWeight: "600", fontSize: 13 }}>
          Messwerte
        </Text>
        {form.measurements.map((m, index) => (
          <View
            key={index}
            style={{
              backgroundColor: C.bg,
              padding: 12,
              borderRadius: 9,
              gap: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Label>Messung {index + 1}</Label>
              <Pressable
                accessibilityLabel={`Messung ${index + 1} entfernen`}
                onPress={() =>
                  setForm((p) => ({
                    ...p,
                    measurements: p.measurements.filter((_, i) => i !== index),
                  }))
                }
              >
                <Icon name="x" size={16} />
              </Pressable>
            </View>
            <Field
              label="Bezeichnung"
              value={m.label}
              placeholder="z. B. Reifendruck vorne"
              onChangeText={(v) =>
                setForm((p) => ({
                  ...p,
                  measurements: p.measurements.map((x, i) =>
                    i === index ? { ...x, label: v } : x,
                  ),
                }))
              }
            />
            <FormRow>
              <Field
                label="Wert"
                value={m.value}
                placeholder="2,4"
                onChangeText={(v) =>
                  setForm((p) => ({
                    ...p,
                    measurements: p.measurements.map((x, i) =>
                      i === index ? { ...x, value: v } : x,
                    ),
                  }))
                }
              />
              <Field
                label="Einheit"
                value={m.unit}
                placeholder="bar"
                onChangeText={(v) =>
                  setForm((p) => ({
                    ...p,
                    measurements: p.measurements.map((x, i) =>
                      i === index ? { ...x, unit: v } : x,
                    ),
                  }))
                }
              />
            </FormRow>
          </View>
        ))}
        {errors.measurements && (
          <Text style={{ color: C.red, fontSize: 12 }}>
            {errors.measurements}
          </Text>
        )}
        <Button
          label="Messwert hinzufügen"
          icon="plus"
          variant="secondary"
          onPress={() =>
            setForm((p) => ({
              ...p,
              measurements: [
                ...p.measurements,
                { label: "", value: "", unit: "" },
              ],
            }))
          }
        />
      </View>
      <Divider />
      <View style={{ gap: 14 }}>
        <Label>04 / Ersatzteile & Kalkulation</Label>
        <PartsEditor value={parts} onChange={setParts} errors={errors} />
        <Divider />
        <Text style={{ color: C.ink, fontSize: 16, fontWeight: "600" }}>
          Weitere Kosten & Leistungen
        </Text>
        <FormRow>
          <Field
            label="Weitere eigene Kosten (EUR)"
            value={cost}
            onChangeText={setCost}
            placeholder="0,00"
            keyboardType="decimal-pad"
            error={errors.otherCostCents || errors.costCents}
          />
          <Field
            label="Arbeitslohn / weitere Leistungen (EUR)"
            value={price}
            onChangeText={setPrice}
            placeholder="0,00"
            keyboardType="decimal-pad"
            error={errors.servicePriceCents || errors.priceCents}
          />
        </FormRow>
        <Text style={{ color: C.muted, fontSize: 12, lineHeight: 19 }}>
          Ersatzteile hier nicht erneut einrechnen. Bei älteren Aufträgen sind
          die bisherigen Gesamtbeträge als Basiswerte erhalten; bei einer
          Aufteilung in Teilepositionen diese Basiswerte entsprechend
          reduzieren.
        </Text>
        <PricingSummary
          totals={totals}
          otherCostCents={liveCost}
          servicePriceCents={livePrice}
          valid={validQuantities}
        />
        <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17 }}>
          Alle Beträge in EUR auf gleicher Basis eingeben. Die Differenz ist
          keine steuerliche Gewinnberechnung.
        </Text>
      </View>
    </Panel>
  );
}
