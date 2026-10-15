import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useWorkshop } from "../../hooks/use-workshop";
import {
  dateInput,
  money,
  type Customer,
  type Vehicle,
} from "../../shared/workshop";
import {
  Avatar,
  Badge,
  Button,
  C,
  Card,
  Copy,
  Divider,
  Empty,
  Heading,
  Icon,
  Label,
  Panel,
  Plate,
  Search,
} from "./ui";

export function CustomersPage({
  onOpen,
  onNew,
}: {
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const { data, ready } = useWorkshop();
  const [query, setQuery] = useState("");
  const customers = data.customers
    .filter((c) =>
      `${c.name} ${c.phone} ${c.email} ${data.vehicles
        .filter((v) => v.customerId === c.id)
        .map((v) => v.plate)
        .join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
  return (
    <View style={{ gap: 23 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 15,
          flexWrap: "wrap",
        }}
      >
        <View style={{ gap: 7 }}>
          <Heading size={30}>Ihre Kunden.</Heading>
          <Copy>Menschen, Fahrzeuge und die Geschichte dahinter.</Copy>
        </View>
        <Button
          label="Neuer Kunde"
          icon="user-plus"
          disabled={!ready}
          onPress={onNew}
        />
      </View>
      <Search
        value={query}
        onChange={setQuery}
        placeholder="Name, Telefonnummer oder Kennzeichen suchen …"
      />
      <View style={{ flexDirection: "row", gap: 18 }}>
        <Label>{data.customers.length} Kunden</Label>
        <Label>{data.vehicles.length} Fahrzeuge</Label>
      </View>
      <Card>
        {customers.map((c) => {
          const vehicles = data.vehicles.filter((v) => v.customerId === c.id);
          const history = data.orders.filter((o) => o.customerId === c.id);
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`${c.name}, Kundenkartei öffnen`}
              onPress={() => onOpen(c.id)}
              style={({ pressed }) => ({
                padding: 21,
                borderBottomWidth: 1,
                borderBottomColor: C.line,
                flexDirection: "row",
                alignItems: "center",
                gap: 15,
                backgroundColor: pressed ? C.bg : C.paper,
              })}
            >
              <Avatar name={c.name} size={46} />
              <View style={{ flex: 1, gap: 7 }}>
                <Text style={{ color: C.ink, fontWeight: "600", fontSize: 15 }}>
                  {c.name}
                </Text>
                <View
                  style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
                >
                  <Icon name="phone" size={12} />
                  <Text style={{ color: C.muted, fontSize: 12 }}>
                    {c.phone}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}
                >
                  {vehicles.map((v) => (
                    <Plate key={v.id} plate={v.plate} />
                  ))}
                </View>
                <Text style={{ color: C.muted, fontSize: 11 }}>
                  {vehicles.length} Fahrzeuge · {history.length} Aufträge
                </Text>
              </View>
              <Icon name="chevron-right" size={17} />
            </Pressable>
          );
        })}
        {!customers.length && (
          <Empty
            title="Noch kein Kunde in Sicht"
            description={
              query
                ? "Für diese Suche gibt es keinen Treffer."
                : "Speichern Sie den Kunden einmal und nutzen Sie seine Daten in jedem weiteren Auftrag."
            }
            action={
              <Button
                label="Kunde anlegen"
                icon="user-plus"
                onPress={onNew}
                disabled={!ready}
              />
            }
          />
        )}
      </Card>
    </View>
  );
}
export function CustomerDetail({
  customerId,
  onClose,
  onEdit,
  onVehicle,
  onNewOrder,
  onOrder,
}: {
  customerId: string;
  onClose: () => void;
  onEdit: (c: Customer) => void;
  onVehicle: (c: Customer, v?: Vehicle) => void;
  onNewOrder: (id: string) => void;
  onOrder: (id: string) => void;
}) {
  const { data } = useWorkshop();
  const [vehicleFilter, setVehicleFilter] = useState("");
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return null;
  const vehicles = data.vehicles.filter((v) => v.customerId === customerId);
  const history = data.orders
    .filter(
      (o) =>
        o.customerId === customerId &&
        (!vehicleFilter || o.vehicleId === vehicleFilter),
    )
    .sort((a, b) => b.receivedDate.localeCompare(a.receivedDate));
  return (
    <Panel
      title={customer.name}
      subtitle="Kundenkartei / Fahrzeuge & Reparaturhistorie"
      onClose={onClose}
      footer={
        <>
          <Button
            label="Kunde bearbeiten"
            icon="edit-2"
            variant="secondary"
            onPress={() => onEdit(customer)}
          />
          <Button
            label="Neuer Auftrag"
            icon="plus"
            onPress={() => onNewOrder(customerId)}
          />
        </>
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
        <Avatar name={customer.name} size={58} color={C.orangeLight} />
        <View style={{ gap: 7, flex: 1 }}>
          <View style={{ flexDirection: "row", gap: 9, alignItems: "center" }}>
            <Icon name="phone" size={15} />
            <Text selectable style={{ color: C.ink, fontSize: 15 }}>
              {customer.phone}
            </Text>
          </View>
          {customer.email ? (
            <View
              style={{ flexDirection: "row", gap: 9, alignItems: "center" }}
            >
              <Icon name="mail" size={15} />
              <Text selectable style={{ color: C.muted, fontSize: 13 }}>
                {customer.email}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {!!customer.address && (
        <Card style={{ padding: 14, gap: 7 }}>
          <Label>Rechnungsadresse</Label>
          <Copy color={C.ink}>{customer.address}</Copy>
        </Card>
      )}
      {customer.notes ? (
        <View
          style={{
            backgroundColor: C.orangeLight,
            padding: 14,
            borderRadius: 8,
            gap: 5,
          }}
        >
          <Label>Kundennotiz</Label>
          <Copy color="#916345">{customer.notes}</Copy>
        </View>
      ) : null}
      <Divider />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Heading size={18}>Fahrzeuge ({vehicles.length})</Heading>
        <Button
          label="Hinzufügen"
          icon="plus"
          compact
          variant="ghost"
          onPress={() => onVehicle(customer)}
        />
      </View>
      {vehicles.map((v) => (
        <Card key={v.id} style={{ padding: 16, gap: 13 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ gap: 7 }}>
              <Heading size={16}>
                {v.make} {v.model}
              </Heading>
              <Plate plate={v.plate} />
            </View>
            <Pressable
              accessibilityLabel={`${v.plate} bearbeiten`}
              onPress={() => onVehicle(customer, v)}
              style={{ padding: 10, backgroundColor: C.bg, borderRadius: 7 }}
            >
              <Icon name="edit-2" size={15} />
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", gap: 22, flexWrap: "wrap" }}>
            {[
              ["Baujahr", v.year || "–"],
              ["Kilometerstand", v.mileage.toLocaleString("de-DE") + " km"],
              ["Antrieb", v.fuel || "–"],
            ].map(([label, value]) => (
              <View key={label} style={{ gap: 5 }}>
                <Label>{label}</Label>
                <Text style={{ color: C.ink, fontSize: 12 }}>{value}</Text>
              </View>
            ))}
          </View>
          {!!v.vin && <Copy>FIN: {v.vin}</Copy>}
        </Card>
      ))}
      {!vehicles.length && (
        <Copy>
          Noch kein Fahrzeug hinterlegt. Fügen Sie es vor dem ersten Auftrag
          hinzu.
        </Copy>
      )}
      <Divider />
      <Heading size={18}>Auftrags- & Reparaturhistorie</Heading>
      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        <Button
          label="Alle Fahrzeuge"
          variant={!vehicleFilter ? "primary" : "secondary"}
          compact
          onPress={() => setVehicleFilter("")}
        />
        {vehicles.map((v) => (
          <Button
            key={v.id}
            label={v.plate}
            compact
            variant={vehicleFilter === v.id ? "primary" : "secondary"}
            onPress={() => setVehicleFilter(v.id)}
          />
        ))}
      </View>
      {history.length ? (
        history.map((o) => (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            onPress={() => onOrder(o.id)}
            style={{
              backgroundColor: C.bg,
              padding: 15,
              borderRadius: 9,
              gap: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: C.ink,
                  fontWeight: "600",
                  fontSize: 14,
                  flex: 1,
                }}
              >
                {o.title}
              </Text>
              <Icon name="chevron-right" size={16} />
            </View>
            <Text style={{ color: C.muted, fontSize: 11 }}>
              {o.number} ·{" "}
              {data.vehicles.find((v) => v.id === o.vehicleId)?.plate}
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Badge status={o.status} />
              <Text style={{ color: C.muted, fontSize: 11 }}>
                {o.completedDate
                  ? `Fertig ${dateInput(o.completedDate)}`
                  : `Eingang ${dateInput(o.receivedDate)}`}
              </Text>
              <Text
                style={{
                  color: C.ink,
                  fontWeight: "600",
                  marginLeft: "auto",
                  fontSize: 12,
                }}
              >
                {money(o.priceCents)}
              </Text>
            </View>
          </Pressable>
        ))
      ) : (
        <Copy>Für dieses Fahrzeug wurden noch keine Aufträge erfasst.</Copy>
      )}
    </Panel>
  );
}
