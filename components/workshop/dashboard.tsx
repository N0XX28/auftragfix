import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useWorkshop } from "../../hooks/use-workshop";
import { dayLabel, isOverdue, localToday, money } from "../../shared/workshop";
import { OrderRows, type Filter } from "./orders";
import {
  Avatar,
  Button,
  C,
  Card,
  Copy,
  Empty,
  Heading,
  Icon,
  Label,
  type IconName,
} from "./ui";

export function Dashboard({
  onNew,
  onOpen,
  onOrders,
  onCustomers,
}: {
  onNew: () => void;
  onOpen: (id: string) => void;
  onOrders: (f: Filter) => void;
  onCustomers: () => void;
}) {
  const { data, ready, mode } = useWorkshop();
  const { width } = useWindowDimensions();
  const desktop = width > 1140;
  const active = data.orders
    .filter((o) => o.status !== "done")
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const overdue = active.filter((o) => isOverdue(o));
  const dueToday = active.filter((o) => o.deadline === localToday());
  const volume = active.reduce((sum, o) => sum + o.priceCents, 0);
  const stats: {
    label: string;
    value: string;
    note: string;
    icon: IconName;
    filter: Filter;
    color: string;
    bg: string;
  }[] = [
    {
      label: "AKTIVE AUFTRÄGE",
      value: String(active.length).padStart(2, "0"),
      note: `${data.orders.filter((o) => o.status === "working").length} davon in Arbeit`,
      icon: "tool",
      filter: "all",
      color: C.orange,
      bg: C.orangeLight,
    },
    {
      label: "HEUTE FÄLLIG",
      value: String(dueToday.length).padStart(2, "0"),
      note: "Termine im Blick behalten",
      icon: "calendar",
      filter: "today",
      color: C.blue,
      bg: C.blueLight,
    },
    {
      label: "ÜBERFÄLLIG",
      value: String(overdue.length).padStart(2, "0"),
      note: overdue.length
        ? "Benötigt Ihre Aufmerksamkeit"
        : "Alles im Zeitplan",
      icon: "clock",
      filter: "overdue",
      color: C.red,
      bg: C.redLight,
    },
    {
      label: "AUFTRAGSVOLUMEN",
      value: money(volume),
      note: "Verkaufspreise offener Aufträge",
      icon: "trending-up",
      filter: "all",
      color: C.green,
      bg: C.greenLight,
    },
  ];
  return (
    <View style={{ gap: 26 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: C.orange,
              }}
            />
            <Label>Ihr Werkstatt-Cockpit</Label>
          </View>
          <Heading size={width < 500 ? 29 : 34}>Alles im Blick.</Heading>
          <Copy>Kunden, Fahrzeuge und Aufträge. Ein Ort für Ihren Alltag.</Copy>
        </View>
        <Button
          label="Neuer Auftrag"
          icon="plus"
          onPress={onNew}
          disabled={!ready}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 13, flexWrap: "wrap" }}>
        {stats.map((stat, i) => (
          <Pressable
            key={stat.label}
            accessibilityRole="button"
            accessibilityLabel={`${stat.label}: ${stat.value}`}
            onPress={() => onOrders(stat.filter)}
            style={({ pressed }) => ({
              flex: width > 850 ? 1 : undefined,
              width: width > 850 ? undefined : "47.8%",
              minWidth: width > 850 ? 130 : 0,
              backgroundColor: C.paper,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 11,
              padding: width < 500 ? 15 : 19,
              gap: 14,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 6,
              }}
            >
              <Text
                style={{
                  color: C.muted,
                  fontSize: 9,
                  fontWeight: "600",
                  letterSpacing: 0.6,
                  flex: 1,
                }}
              >
                {stat.label}
              </Text>
              <View
                style={{
                  padding: 7,
                  backgroundColor: stat.bg,
                  borderRadius: 8,
                }}
              >
                <Icon name={stat.icon} color={stat.color} size={16} />
              </View>
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                color: C.ink,
                fontSize: i === 3 ? 26 : 33,
                fontWeight: "700",
                letterSpacing: -1,
              }}
            >
              {stat.value}
            </Text>
            <Text
              style={{
                color: i === 2 && overdue.length ? C.red : C.muted,
                fontSize: 10,
                lineHeight: 16,
              }}
            >
              {stat.note}
            </Text>
          </Pressable>
        ))}
      </View>
      <View
        style={{
          flexDirection: desktop ? "row" : "column",
          gap: 22,
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            flex: desktop ? 2.9 : undefined,
            width: desktop ? undefined : "100%",
            gap: 22,
          }}
        >
          <Card>
            <View
              style={{
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <View style={{ gap: 5 }}>
                <Heading size={18}>Aktive Aufträge</Heading>
                <Copy>Was als Nächstes ansteht.</Copy>
              </View>
              <Button
                label="Alle ansehen"
                icon="arrow-up-right"
                variant="ghost"
                compact
                onPress={() => onOrders("all")}
              />
            </View>
            {active.length ? (
              <OrderRows orders={active.slice(0, 5)} onOpen={onOpen} />
            ) : (
              <Empty
                title="Platz für den nächsten Auftrag"
                description="Ihre offenen Aufträge erscheinen hier – mit Kunde, Fahrzeug und Deadline."
                action={
                  <Button
                    label="Auftrag anlegen"
                    onPress={onNew}
                    icon="plus"
                    disabled={!ready}
                  />
                }
              />
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                padding: 14,
                paddingHorizontal: 21,
                backgroundColor: "#FCFDFB",
              }}
            >
              <Icon name="info" size={12} />
              <Text style={{ color: C.muted, fontSize: 10 }}>
                Nach Deadline sortiert · {active.length} offene Aufträge
              </Text>
            </View>
          </Card>
          <Card style={{ padding: 21 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 15,
                flexWrap: "wrap",
              }}
            >
              <View
                style={{
                  borderRadius: 12,
                  padding: 13,
                  backgroundColor: C.orangeLight,
                }}
              >
                <Icon name="users" color={C.orange} size={24} />
              </View>
              <View style={{ flex: 1, minWidth: 160, gap: 6 }}>
                <Heading size={17}>Kunden kennen. Zeit sparen.</Heading>
                <Copy>
                  {data.customers.length} Kunden und {data.vehicles.length}{" "}
                  Fahrzeuge in Ihrer Kartei. Stammdaten beim nächsten Auftrag
                  einfach auswählen.
                </Copy>
              </View>
              <Button
                label="Zur Kundenkartei"
                icon="arrow-right"
                variant="secondary"
                compact
                onPress={onCustomers}
              />
            </View>
          </Card>
        </View>
        <View
          style={{
            flex: desktop ? 1 : undefined,
            width: desktop ? undefined : "100%",
            gap: 20,
          }}
        >
          <Card style={{ padding: 20, gap: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Heading size={17}>Terminradar</Heading>
              <Icon name="calendar" size={18} />
            </View>
            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 36,
                  color: C.ink,
                  letterSpacing: -1,
                }}
              >
                {new Date(localToday() + "T12:00:00").getDate()}
              </Text>
              <View>
                <Text style={{ fontWeight: "600", color: C.ink, fontSize: 12 }}>
                  {new Date(localToday() + "T12:00:00").toLocaleDateString(
                    "de-DE",
                    { weekday: "long" },
                  )}
                </Text>
                <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>
                  {new Date(localToday() + "T12:00:00").toLocaleDateString(
                    "de-DE",
                    { month: "long", year: "numeric" },
                  )}
                </Text>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: C.line }} />
            {active.slice(0, 3).map((o) => {
              const c = data.customers.find((c) => c.id === o.customerId);
              const late = isOverdue(o);
              return (
                <Pressable
                  key={o.id}
                  accessibilityRole="button"
                  onPress={() => onOpen(o.id)}
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "stretch",
                  }}
                >
                  <View
                    style={{
                      width: 3,
                      borderRadius: 2,
                      backgroundColor: late ? C.red : C.orange,
                    }}
                  />
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text
                      style={{
                        color: late ? C.red : C.orange,
                        fontWeight: "600",
                        fontSize: 10,
                      }}
                    >
                      {late
                        ? "ÜBERFÄLLIG"
                        : o.deadline === localToday()
                          ? "HEUTE FÄLLIG"
                          : dayLabel(o.deadline).toUpperCase()}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ color: C.ink, fontSize: 12, fontWeight: "600" }}
                    >
                      {o.title}
                    </Text>
                    <Text style={{ color: C.muted, fontSize: 11 }}>
                      {c?.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            {!active.length && (
              <Copy>Keine offenen Termine. Alles erledigt.</Copy>
            )}
          </Card>
          <View
            style={{
              backgroundColor: C.ink,
              borderRadius: 12,
              padding: 21,
              gap: 13,
            }}
          >
            <View
              style={{
                backgroundColor: "#37433E",
                padding: 9,
                borderRadius: 9,
                alignSelf: "flex-start",
              }}
            >
              <Icon name="database" color="#B8CEBF" size={20} />
            </View>
            <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
              {"Sauber erfasst.\nBereit für Ihre Datenbank."}
            </Text>
            <Text style={{ color: "#A5B2AA", fontSize: 12, lineHeight: 19 }}>
              Kunden, Fahrzeuge und Aufträge bleiben verknüpft – auch beim SQL-
              und JSON-Export.
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 3,
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: C.orange,
                }}
              />
              <Text style={{ color: "#B8C5BC", fontSize: 10 }}>
                {mode === "demo"
                  ? "Demodaten lokal gespeichert"
                  : "Private MySQL-Datenbank"}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={{ color: "#9AA29D", fontSize: 10 }}>
        AUFTRAGFIX / WENIGER VERWALTUNG. MEHR WERKSTATT.
      </Text>
    </View>
  );
}
