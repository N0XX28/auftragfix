import { Text, View } from "react-native";
import {
  calculateOrderTotals,
  MAX_AMOUNT_CENTS,
  money,
} from "../../shared/workshop";
import { C, Card, Copy, Divider, Heading, Label } from "./ui";

export function PricingSummary({
  totals,
  otherCostCents,
  servicePriceCents,
  valid = true,
}: {
  totals: ReturnType<typeof calculateOrderTotals>;
  otherCostCents: number;
  servicePriceCents: number;
  valid?: boolean;
}) {
  const usable =
    valid &&
    Number.isFinite(totals.costCents) &&
    Number.isFinite(totals.priceCents) &&
    totals.costCents <= MAX_AMOUNT_CENTS &&
    totals.priceCents <= MAX_AMOUNT_CENTS;
  const amount = (value: number) => (usable ? money(value) : "–");
  const row = (label: string, value: number) => (
    <View
      style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}
    >
      <Copy>{label}</Copy>
      <Text style={{ color: C.ink, fontWeight: "500" }}>{amount(value)}</Text>
    </View>
  );
  return (
    <Card style={{ padding: 17, gap: 13, backgroundColor: "#FAFBF9" }}>
      <Label>Automatische Kalkulation</Label>
      {row("Ersatzteile · Einkauf", totals.partsCostCents)}
      {row("Weitere eigene Kosten", otherCostCents)}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Text style={{ color: C.ink, fontWeight: "600" }}>Gesamtkosten</Text>
        <Heading size={20}>{amount(totals.costCents)}</Heading>
      </View>
      <Divider />
      {row("Ersatzteile · Verkauf", totals.partsPriceCents)}
      {row("Arbeitslohn / weitere Leistungen", servicePriceCents)}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Text style={{ color: C.orange, fontWeight: "700" }}>Gesamtpreis</Text>
        <Text style={{ color: C.orange, fontSize: 23, fontWeight: "700" }}>
          {amount(totals.priceCents)}
        </Text>
      </View>
      <Divider />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text
          style={{
            color: totals.marginCents < 0 ? C.red : C.green,
            fontWeight: "600",
          }}
        >
          Differenz
        </Text>
        <Text
          style={{
            color: totals.marginCents < 0 ? C.red : C.green,
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          {amount(totals.marginCents)}
        </Text>
      </View>
      {!usable && (
        <Copy color={C.red}>
          Bitte gültige Mengen und Beträge eingeben. Summen werden erst mit
          gültigen Werten angezeigt.
        </Copy>
      )}
    </Card>
  );
}
