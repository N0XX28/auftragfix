import { useEffect, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useWorkshop } from "../../hooks/use-workshop";
import {
  dayLabel,
  isOverdue,
  localToday,
  money,
  type Order,
} from "../../shared/workshop";
import {
  Avatar,
  Badge,
  Button,
  C,
  Card,
  Copy,
  Empty,
  Heading,
  Icon,
  Label,
  Plate,
  Search,
} from "./ui";

export type Filter = "all" | "new" | "working" | "done" | "overdue" | "today";
export function OrderRows({
  orders,
  onOpen,
}: {
  orders: Order[];
  onOpen: (id: string) => void;
}) {
  const { data } = useWorkshop();
  const { width } = useWindowDimensions();
  const wide = width >= 1020;
  return (
    <View>
      {wide && (
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 21,
            paddingVertical: 12,
            backgroundColor: "#FCFDFB",
            borderBottomWidth: 1,
            borderBottomColor: C.line,
          }}
        >
          <View style={{ flex: 2.5 }}>
            <Label>Fahrzeug & Kunde</Label>
          </View>
          <View style={{ flex: 1.4 }}>
            <Label>Status</Label>
          </View>
          <View style={{ flex: 1 }}>
            <Label>Deadline</Label>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Label>Preis</Label>
          </View>
          <View style={{ width: 18 }} />
        </View>
      )}
      {orders.map((o) => {
        const c = data.customers.find((c) => c.id === o.customerId);
        const v = data.vehicles.find((v) => v.id === o.vehicleId);
        const overdue = isOverdue(o);
        const dueToday = o.status !== "done" && o.deadline === localToday();
        return (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            accessibilityLabel={`${o.title}, ${c?.name}, Details öffnen`}
            onPress={() => onOpen(o.id)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? C.bg : C.paper,
              padding: wide ? 21 : 17,
              borderBottomWidth: 1,
              borderBottomColor: C.line,
              flexDirection: wide ? "row" : "column",
              alignItems: wide ? "center" : "stretch",
              gap: wide ? 0 : 13,
            })}
          >
            <View
              style={{
                flex: wide ? 2.5 : undefined,
                flexDirection: "row",
                gap: 11,
                alignItems: "center",
                paddingRight: 10,
              }}
            >
              <View
                style={{
                  width: 39,
                  height: 39,
                  borderRadius: 9,
                  backgroundColor: C.bg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="truck" color={C.ink} size={19} />
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: C.ink, fontWeight: "600", fontSize: 13 }}
                >
                  {v?.make} {v?.model}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 7,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Plate plate={v?.plate ?? "–"} />
                  <Text style={{ color: C.muted, fontSize: 11 }}>
                    {c?.name}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{ color: C.muted, fontSize: 11 }}
                >
                  {o.title}
                </Text>
              </View>
              {!wide && <Icon name="chevron-right" size={16} />}
            </View>
            {wide ? (
              <>
                <View style={{ flex: 1.4, alignItems: "flex-start" }}>
                  <Badge status={o.status} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      color: overdue ? C.red : dueToday ? C.orange : C.ink,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {dayLabel(o.deadline)}
                  </Text>
                  <Text
                    style={{ color: overdue ? C.red : C.muted, fontSize: 10 }}
                  >
                    {overdue
                      ? "Überfällig"
                      : dueToday
                        ? "Heute fällig"
                        : o.status === "done"
                          ? "Abgeschlossen"
                          : "Geplant"}
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={{ color: C.ink, fontWeight: "600", fontSize: 13 }}
                  >
                    {money(o.priceCents)}
                  </Text>
                </View>
                <View style={{ width: 18, alignItems: "flex-end" }}>
                  <Icon name="chevron-right" size={14} />
                </View>
              </>
            ) : (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Badge status={o.status} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 11,
                    color: overdue ? C.red : dueToday ? C.orange : C.muted,
                  }}
                >
                  {overdue ? "Überfällig · " : dueToday ? "Heute · " : "Bis "}
                  {dayLabel(o.deadline)}
                </Text>
                <Text style={{ color: C.ink, fontWeight: "600", fontSize: 13 }}>
                  {money(o.priceCents)}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
export function OrdersPage({
  onOpen,
  onNew,
  initialFilter = "all",
}: {
  onOpen: (id: string) => void;
  onNew: () => void;
  initialFilter?: Filter;
}) {
  const { data, ready } = useWorkshop();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);
  useEffect(() => setFilter(initialFilter), [initialFilter]);
  const filtered = data.orders
    .filter((o) => {
      const c = data.customers.find((c) => c.id === o.customerId);
      const v = data.vehicles.find((v) => v.id === o.vehicleId);
      const matches =
        `${o.title} ${o.number} ${c?.name} ${v?.plate} ${v?.make} ${v?.model}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return (
        matches &&
        (filter === "all" ||
          (filter === "overdue" && isOverdue(o)) ||
          (filter === "today" &&
            o.status !== "done" &&
            o.deadline === localToday()) ||
          o.status === filter)
      );
    })
    .sort((a, b) =>
      a.status === "done" && b.status !== "done"
        ? 1
        : b.status === "done" && a.status !== "done"
          ? -1
          : a.deadline.localeCompare(b.deadline),
    );
  return (
    <View style={{ gap: 23 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <View style={{ gap: 7 }}>
          <Heading size={30}>Ihre Aufträge.</Heading>
          <Copy>Vom ersten Befund bis zur letzten Schraube.</Copy>
        </View>
        <Button
          label="Neuer Auftrag"
          icon="plus"
          onPress={onNew}
          disabled={!ready}
        />
      </View>
      <Search
        value={query}
        onChange={setQuery}
        placeholder="Kunde, Kennzeichen oder Auftrag suchen …"
      />
      <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}>
        {(
          [
            ["all", "Alle"],
            ["new", "Neu"],
            ["working", "In Arbeit"],
            ["done", "Fertig"],
            ["today", "Heute fällig"],
            ["overdue", "Überfällig"],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <Button
            key={key}
            label={label}
            compact
            variant={filter === key ? "primary" : "secondary"}
            onPress={() => setFilter(key)}
          />
        ))}
      </View>
      <Card>
        <View
          style={{
            padding: 18,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Heading size={16}>Auftragsliste</Heading>
          <Label>{filtered.length} Einträge</Label>
        </View>
        {filtered.length ? (
          <OrderRows orders={filtered} onOpen={onOpen} />
        ) : (
          <Empty
            title="Keine Aufträge gefunden"
            description={
              query || filter !== "all"
                ? "Passen Sie die Suche oder den Filter an."
                : "Legen Sie den ersten Auftrag an und wählen Sie einen Kunden aus der Kartei."
            }
            action={
              <Button
                label="Auftrag anlegen"
                icon="plus"
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
