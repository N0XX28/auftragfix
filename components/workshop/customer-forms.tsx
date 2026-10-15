import { useState } from "react";
import { Text, View } from "react-native";
import { useWorkshop } from "../../hooks/use-workshop";
import {
  customerSchema,
  newId,
  vehicleSchema,
  type Customer,
  type Vehicle,
} from "../../shared/workshop";
import { AlertBox, Button, Field, FormRow, Panel } from "./ui";

export function CustomerForm({
  customer,
  onClose,
  onSaved,
}: {
  customer?: Customer;
  onClose: () => void;
  onSaved: (c: Customer) => void;
}) {
  const { saveCustomer, saving } = useWorkshop();
  const [form, setForm] = useState<Customer>(
    customer
      ? { ...customer, address: customer.address ?? "" }
      : { id: newId(), name: "", phone: "", address: "", email: "", notes: "" },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const set = (k: keyof Customer, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));
  async function submit() {
    const result = customerSchema.safeParse(form);
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((i) => [i.path[0], i.message]),
        ),
      );
      return;
    }
    setErrors({});
    setFailure("");
    try {
      await saveCustomer(result.data);
      onSaved(result.data);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    }
  }
  return (
    <Panel
      title={customer ? "Kunde bearbeiten" : "Neuer Kunde"}
      subtitle="Einmal erfassen. Beim nächsten Auftrag wiederverwenden."
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
            label={saving ? "Wird gespeichert …" : "Kunde speichern"}
            icon="check"
            onPress={() => void submit()}
            disabled={saving}
          />
        </>
      }
    >
      {failure ? <AlertBox tone="error">{failure}</AlertBox> : null}
      <Field
        label="Kundenname *"
        value={form.name}
        onChangeText={(v) => set("name", v)}
        error={errors.name}
        placeholder="Vor- und Nachname / Firma"
        autoFocus
      />
      <FormRow>
        <Field
          label="Telefonnummer *"
          value={form.phone}
          onChangeText={(v) => set("phone", v)}
          error={errors.phone}
          placeholder="+49 …"
          keyboardType="phone-pad"
        />
        <Field
          label="E-Mail"
          value={form.email}
          onChangeText={(v) => set("email", v)}
          error={errors.email}
          placeholder="kunde@beispiel.de"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </FormRow>
      <Field
        label="Rechnungsadresse"
        value={form.address}
        onChangeText={(v) => set("address", v)}
        error={errors.address}
        multiline
        placeholder="Straße und Hausnummer\nPLZ und Ort"
      />
      <Field
        label="Kundennotizen"
        value={form.notes}
        onChangeText={(v) => set("notes", v)}
        multiline
        placeholder="Abholzeiten, Absprachen oder wichtige Hinweise"
      />
      <Text style={{ color: "#7C8582", fontSize: 12 }}>
        * Pflichtfelder. Fahrzeuge werden danach separat zugeordnet.
      </Text>
    </Panel>
  );
}
export function VehicleForm({
  customer,
  vehicle,
  onClose,
  onSaved,
}: {
  customer: Customer;
  vehicle?: Vehicle;
  onClose: () => void;
  onSaved: (v: Vehicle) => void;
}) {
  const { saveVehicle, saving } = useWorkshop();
  const [form, setForm] = useState<Vehicle>(
    vehicle ?? {
      id: newId(),
      customerId: customer.id,
      plate: "",
      make: "",
      model: "",
      year: "",
      vin: "",
      mileage: 0,
      fuel: "",
    },
  );
  const [km, setKm] = useState(vehicle ? String(vehicle.mileage) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const set = (k: keyof Vehicle, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));
  async function submit() {
    const result = vehicleSchema.safeParse({
      ...form,
      plate: form.plate.toUpperCase(),
      mileage: /^\d*$/.test(km) ? Number(km || 0) : NaN,
    });
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((i) => [i.path[0], i.message]),
        ),
      );
      return;
    }
    setErrors({});
    setFailure("");
    try {
      await saveVehicle(result.data);
      onSaved(result.data);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    }
  }
  return (
    <Panel
      title={vehicle ? "Fahrzeug bearbeiten" : "Fahrzeug hinzufügen"}
      subtitle={`Kunde: ${customer.name}`}
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
            label={saving ? "Wird gespeichert …" : "Fahrzeug speichern"}
            icon="check"
            onPress={() => void submit()}
            disabled={saving}
          />
        </>
      }
    >
      {failure ? <AlertBox tone="error">{failure}</AlertBox> : null}
      <Field
        label="Kennzeichen *"
        value={form.plate}
        onChangeText={(v) => set("plate", v)}
        error={errors.plate}
        placeholder="B AB 1234"
        autoCapitalize="characters"
        autoFocus
      />
      <FormRow>
        <Field
          label="Marke *"
          value={form.make}
          onChangeText={(v) => set("make", v)}
          error={errors.make}
          placeholder="z. B. Volkswagen"
        />
        <Field
          label="Modell *"
          value={form.model}
          onChangeText={(v) => set("model", v)}
          error={errors.model}
          placeholder="z. B. Golf VII"
        />
      </FormRow>
      <FormRow>
        <Field
          label="Baujahr"
          value={form.year}
          onChangeText={(v) => set("year", v)}
          error={errors.year}
          placeholder="2018"
          keyboardType="number-pad"
        />
        <Field
          label="Kilometerstand"
          value={km}
          onChangeText={setKm}
          error={errors.mileage}
          placeholder="0"
          keyboardType="number-pad"
        />
      </FormRow>
      <Field
        label="Fahrzeug-Identifizierungsnummer (FIN)"
        value={form.vin}
        onChangeText={(v) => set("vin", v.toUpperCase())}
        error={errors.vin}
        placeholder="Optional"
        autoCapitalize="characters"
      />
      <Field
        label="Kraftstoff / Antrieb"
        value={form.fuel}
        onChangeText={(v) => set("fuel", v)}
        placeholder="Benzin, Diesel, Elektro …"
      />
      <View>
        <Text style={{ color: "#7C8582", fontSize: 12 }}>
          * Pflichtfelder. Alle Reparaturen bleiben diesem Fahrzeug zugeordnet.
        </Text>
      </View>
    </Panel>
  );
}
