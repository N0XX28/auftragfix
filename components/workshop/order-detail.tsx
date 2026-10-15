import { useState } from "react";
import { Text, View } from "react-native";
import { useWorkshop } from "../../hooks/use-workshop";
import {
  calculateOrderTotals,
  dateInput,
  localToday,
  money,
  normalizeOrder,
  type Order,
} from "../../shared/workshop";
import { PricingSummary } from "./pricing-summary";
import { InvoiceForm } from "./invoice-form";
import {
  AlertBox,
  Avatar,
  Badge,
  Button,
  C,
  Card,
  Copy,
  Divider,
  Heading,
  Icon,
  Label,
  Panel,
  Plate,
} from "./ui";

export function OrderDetail({
  orderId,
  onClose,
  onEdit,
  onCustomer,
}: {
  orderId: string;
  onClose: () => void;
  onEdit: (o: Order) => void;
  onCustomer: (id: string) => void;
}) {
  const { data, saveOrder, deleteOrder, saving } = useWorkshop();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [error, setError] = useState("");
  const storedOrder = data.orders.find((o) => o.id === orderId);
  if (!storedOrder) return null;
  const order = normalizeOrder(storedOrder);
  const totals = calculateOrderTotals(
    order.parts,
    order.otherCostCents,
    order.servicePriceCents,
  );
  const c = data.customers.find((c) => c.id === order.customerId);
  const v = data.vehicles.find((v) => v.id === order.vehicleId);
  async function advance() {
    if (!order) return;
    try {
      await saveOrder({
        ...order,
        status: order.status === "new" ? "working" : "done",
        completedDate:
          order.status === "working" ? localToday() : order.completedDate,
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Statusänderung fehlgeschlagen.",
      );
    }
  }
  async function remove() {
    if (!order) return;
    try {
      await deleteOrder(order.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Löschen fehlgeschlagen.");
    }
  }
  if (confirmDelete)
    return (
      <Panel
        title="Auftrag wirklich löschen?"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button
              label="Behalten"
              variant="secondary"
              onPress={() => setConfirmDelete(false)}
              disabled={saving}
            />
            <Button
              label={saving ? "Wird gelöscht …" : "Auftrag endgültig löschen"}
              icon="trash-2"
              variant="danger"
              disabled={saving}
              onPress={() => void remove()}
            />
          </>
        }
      >
        <AlertBox tone="error">
          {order.number} – {order.title} für {c?.name} wird inklusive Schäden,
          Leistungen, Messwerten und Kosten unwiderruflich gelöscht. Kunde und
          Fahrzeug bleiben erhalten.
        </AlertBox>
        {error ? <Copy color={C.red}>{error}</Copy> : null}
      </Panel>
    );
  if (showInvoice)
    return (
      <InvoiceForm orderId={orderId} onClose={() => setShowInvoice(false)} />
    );
  return (
    <Panel
      title={order.title}
      subtitle={order.number}
      onClose={onClose}
      footer={
        <>
          <Button
            label="Löschen"
            variant="ghost"
            icon="trash-2"
            disabled={saving}
            onPress={() => setConfirmDelete(true)}
          />
          <Button
            label="Bearbeiten"
            icon="edit-2"
            variant="secondary"
            disabled={saving}
            onPress={() => onEdit(order)}
          />
          {order.status !== "done" && (
            <Button
              label={
                order.status === "new"
                  ? "Arbeit beginnen"
                  : "Als fertig markieren"
              }
              icon="check"
              disabled={saving}
              onPress={() => void advance()}
            />
          )}
        </>
      }
    >
      {error ? <AlertBox tone="error">{error}</AlertBox> : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Badge status={order.status} />
        <Label>Auftragsdetails</Label>
      </View>
      <Button
        label="Rechnung als PDF"
        icon="file-text"
        onPress={() => setShowInvoice(true)}
        disabled={saving}
      />
      <Card style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar name={c?.name ?? "?"} size={44} />
          <View style={{ flex: 1, gap: 4 }}>
            <Heading size={17}>{c?.name ?? "Kunde"}</Heading>
            <Copy>{c?.phone}</Copy>
          </View>
          <Button
            label="Kartei"
            variant="ghost"
            compact
            icon="external-link"
            onPress={() => onCustomer(order.customerId)}
          />
        </View>
        <Divider />
        <View style={{ marginTop: 10, gap: 8 }}>
          <Text style={{ color: C.ink, fontWeight: "600" }}>
            {v?.make} {v?.model}
          </Text>
          <Plate plate={v?.plate ?? "–"} />
          <Copy>
            Baujahr {v?.year || "–"} · {v?.mileage.toLocaleString("de-DE")} km
          </Copy>
        </View>
      </Card>
      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        {[
          ["Auftragseingang", order.receivedDate],
          ["Deadline", order.deadline],
          ["Fertigstellung", order.completedDate],
        ].map(([label, value]) => (
          <View key={label} style={{ flex: 1, minWidth: 130, gap: 8 }}>
            <Label>{label}</Label>
            <Text style={{ color: C.ink, fontWeight: "600", fontSize: 15 }}>
              {dateInput(value) || "Noch offen"}
            </Text>
          </View>
        ))}
      </View>
      <Divider />
      <View style={{ gap: 8 }}>
        <Label>Schäden / Befund</Label>
        <Copy color={C.ink}>
          {order.damages || "Keine Schäden dokumentiert."}
        </Copy>
      </View>
      <View style={{ gap: 10 }}>
        <Label>Leistungen</Label>
        {order.services
          .split("\n")
          .filter(Boolean)
          .map((line, i) => (
            <View
              key={i}
              style={{ flexDirection: "row", gap: 9, alignItems: "flex-start" }}
            >
              <Icon
                name={order.status === "done" ? "check-circle" : "tool"}
                color={order.status === "done" ? C.green : C.orange}
                size={15}
              />
              <Text
                style={{ flex: 1, color: C.ink, fontSize: 14, lineHeight: 21 }}
              >
                {line}
              </Text>
            </View>
          ))}
      </View>
      <View style={{ gap: 10 }}>
        <Label>Messwerte</Label>
        {order.measurements.length ? (
          order.measurements.map((m, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 10,
                backgroundColor: C.bg,
                padding: 12,
                borderRadius: 7,
              }}
            >
              <Text style={{ color: C.muted, flex: 1, fontSize: 13 }}>
                {m.label}
              </Text>
              <Text style={{ color: C.ink, fontWeight: "600" }}>
                {m.value} {m.unit}
              </Text>
            </View>
          ))
        ) : (
          <Copy>Keine Messwerte erfasst.</Copy>
        )}
      </View>
      <Divider />
      <View style={{ gap: 12 }}>
        <Label>Ersatzteile · {order.parts.length} Positionen</Label>
        {order.parts.length ? (
          order.parts.map((p) => (
            <Card key={p.id} style={{ padding: 14, gap: 10 }}>
              <Heading size={15}>{p.description}</Heading>
              <Copy>Menge: {p.quantity}</Copy>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <Copy>
                  Einkauf: {p.quantity} × {money(p.purchaseCents)}
                </Copy>
                <Text style={{ color: C.ink, fontWeight: "600" }}>
                  {money(p.quantity * p.purchaseCents)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <Copy>
                  Verkauf: {p.quantity} × {money(p.saleCents)}
                </Copy>
                <Text style={{ color: C.orange, fontWeight: "600" }}>
                  {money(p.quantity * p.saleCents)}
                </Text>
              </View>
            </Card>
          ))
        ) : (
          <Copy>Keine Ersatzteile erfasst.</Copy>
        )}
      </View>
      <PricingSummary
        totals={totals}
        otherCostCents={order.otherCostCents}
        servicePriceCents={order.servicePriceCents}
      />
    </Panel>
  );
}
