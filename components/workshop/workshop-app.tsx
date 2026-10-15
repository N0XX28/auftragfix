import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkshop } from "../../hooks/use-workshop";
import type { Customer, Order, Vehicle } from "../../shared/workshop";
import { CustomersPage, CustomerDetail } from "./customers";
import { CustomerForm, VehicleForm } from "./customer-forms";
import { DataPage } from "./data-page";
import { Dashboard } from "./dashboard";
import { OrderDetail } from "./order-detail";
import { OrderForm } from "./order-form";
import { OrdersPage, type Filter } from "./orders";
import { AlertBox, Avatar, Button, C, Icon, type IconName } from "./ui";

type Tab = "dashboard" | "orders" | "customers" | "data";
const nav: { key: Tab; label: string; icon: IconName }[] = [
  { key: "dashboard", label: "Übersicht", icon: "grid" },
  { key: "orders", label: "Aufträge", icon: "clipboard" },
  { key: "customers", label: "Kunden", icon: "users" },
  { key: "data", label: "Daten & Export", icon: "database" },
];
export function WorkshopApp() {
  const w = useWorkshop();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sidebar = width >= 900;
  const [tab, setTab] = useState<Tab>("dashboard");
  const [filter, setFilter] = useState<Filter>("all");
  const [orderForm, setOrderForm] = useState<{
    order?: Order;
    customerId?: string;
  } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState<{
    customer?: Customer;
  } | null>(null);
  const [vehicleForm, setVehicleForm] = useState<{
    customer: Customer;
    vehicle?: Vehicle;
  } | null>(null);
  const [returnCustomer, setReturnCustomer] = useState<string | null>(null);
  const openOrders = (f: Filter) => {
    setFilter(f);
    setTab("orders");
  };
  const newOrder = (id?: string) => {
    setCustomerId(null);
    setOrderForm({ customerId: id });
  };
  const openCustomer = (id: string) => {
    setOrderId(null);
    setCustomerId(id);
  };
  const openOrder = (id: string) => {
    setCustomerId(null);
    setOrderId(id);
  };
  const navigation = (mobile: boolean) =>
    nav.map((n) => (
      <Pressable
        key={n.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: tab === n.key }}
        accessibilityLabel={n.label}
        onPress={() => {
          setTab(n.key);
          if (n.key === "orders") setFilter("all");
        }}
        style={({ pressed }) =>
          mobile
            ? {
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 12,
                opacity: pressed ? 0.7 : 1,
              }
            : {
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 13,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: tab === n.key ? "#36403B" : "transparent",
                opacity: pressed ? 0.7 : 1,
              }
        }
      >
        <Icon
          name={n.icon}
          color={tab === n.key ? C.orange : mobile ? C.muted : "#A5B0A9"}
          size={mobile ? 21 : 18}
        />
        <Text
          style={{
            color:
              tab === n.key
                ? mobile
                  ? C.orange
                  : "#fff"
                : mobile
                  ? C.muted
                  : "#A5B0A9",
            fontSize: mobile ? 10 : 13,
            fontWeight: tab === n.key ? "600" : "400",
          }}
        >
          {mobile && n.key === "data" ? "Daten" : n.label}
        </Text>
        {!mobile && n.key === "orders" && (
          <View
            style={{
              marginLeft: "auto",
              borderRadius: 5,
              paddingHorizontal: 6,
              paddingVertical: 3,
              backgroundColor: "#48524B",
            }}
          >
            <Text style={{ color: "#E8EEE8", fontSize: 10 }}>
              {w.data.orders.filter((o) => o.status !== "done").length}
            </Text>
          </View>
        )}
      </Pressable>
    ));
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.bg,
        flexDirection: "row",
        paddingTop: sidebar ? 0 : insets.top,
      }}
    >
      {sidebar && (
        <View
          style={{
            width: 218,
            backgroundColor: C.ink,
            paddingTop: 35,
            paddingHorizontal: 17,
            paddingBottom: 25,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
              paddingHorizontal: 7,
            }}
          >
            <View
              style={{
                backgroundColor: C.orange,
                width: 35,
                height: 35,
                borderRadius: 9,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="tool" size={21} color="white" />
            </View>
            <Text
              style={{
                color: "#fff",
                fontSize: 21,
                fontWeight: "700",
                letterSpacing: -0.8,
              }}
            >
              Auftrag<Text style={{ color: C.orange }}>Fix</Text>
            </Text>
          </View>
          <Text
            style={{
              color: "#83948A",
              fontSize: 9,
              letterSpacing: 1.4,
              marginLeft: 54,
              marginTop: 8,
            }}
          >
            IHRE WERKSTATT. ORGANISIERT.
          </Text>
          <Text
            style={{
              color: "#687B6E",
              fontSize: 9,
              fontWeight: "600",
              letterSpacing: 1.5,
              marginTop: 47,
              marginBottom: 13,
              paddingLeft: 16,
            }}
          >
            ARBEITSBEREICH
          </Text>
          <View style={{ gap: 7 }}>{navigation(false)}</View>
          <View style={{ flex: 1 }} />
          <View
            style={{
              padding: 14,
              borderRadius: 10,
              backgroundColor: "#2C3630",
              gap: 9,
            }}
          >
            <Icon name="zap" color={C.orange} />
            <Text style={{ color: "#DCE5DD", fontSize: 12, fontWeight: "600" }}>
              Mehr Zeit fürs Wesentliche.
            </Text>
            <Text style={{ color: "#879D8D", fontSize: 11, lineHeight: 17 }}>
              Von der Kundenkartei bis zum fertigen Auftrag.
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingTop: 23,
              paddingHorizontal: 10,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 4,
                backgroundColor: w.mode === "demo" ? C.orange : C.green,
              }}
            />
            <Text style={{ color: "#83998B", fontSize: 10 }}>
              {w.mode === "demo" ? "Demomodus · lokal" : "MySQL · privat"}
            </Text>
          </View>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            height: sidebar ? 76 : 65,
            borderBottomWidth: 1,
            borderBottomColor: C.line,
            backgroundColor: C.paper,
            paddingHorizontal: sidebar ? 33 : 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          {sidebar ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text style={{ color: C.muted, fontSize: 12 }}>Werkstatt</Text>
              <Icon name="chevron-right" size={12} />
              <Text style={{ color: C.ink, fontSize: 12, fontWeight: "600" }}>
                {nav.find((n) => n.key === tab)?.label}
              </Text>
            </View>
          ) : (
            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
            >
              <View
                style={{
                  backgroundColor: C.orange,
                  padding: 7,
                  borderRadius: 7,
                }}
              >
                <Icon name="tool" color="white" size={18} />
              </View>
              <Text
                style={{
                  color: C.ink,
                  fontSize: 20,
                  fontWeight: "700",
                  letterSpacing: -0.7,
                }}
              >
                AuftragFix
              </Text>
            </View>
          )}
          <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
            <Pressable
              onPress={() => setTab("data")}
              accessibilityLabel="Datenspeicher anzeigen"
              style={{
                flexDirection: "row",
                gap: 6,
                alignItems: "center",
                backgroundColor:
                  w.mode === "demo" ? C.orangeLight : C.greenLight,
                paddingHorizontal: 9,
                paddingVertical: 6,
                borderRadius: 5,
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: w.mode === "demo" ? C.orange : C.green,
                }}
              />
              <Text
                style={{
                  color: w.mode === "demo" ? C.orange : C.green,
                  fontSize: 10,
                  fontWeight: "600",
                }}
              >
                {w.mode === "demo" ? "Demo · lokal" : "SQL · privat"}
              </Text>
            </Pressable>
            {sidebar && (
              <>
                <View
                  style={{ width: 1, height: 26, backgroundColor: C.line }}
                />
                <View style={{ gap: 4 }}>
                  <Text
                    style={{ color: C.ink, fontSize: 12, fontWeight: "600" }}
                  >
                    {w.user?.name ?? "Meine Werkstatt"}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 10 }}>
                    AuftragFix Prototyp
                  </Text>
                </View>
                <Avatar
                  name={w.user?.name ?? "Meine Werkstatt"}
                  size={34}
                  color={C.greenLight}
                />
              </>
            )}
          </View>
        </View>
        <ScrollView
          key={tab}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: sidebar ? 31 : 19,
            paddingBottom: 35,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 1480,
              alignSelf: "center",
              gap: 20,
            }}
          >
            {!!w.error && (
              <AlertBox tone="error">
                {w.error}{" "}
                {w.mode === "sql"
                  ? "Bitte unter Daten & Export erneut verbinden."
                  : ""}
              </AlertBox>
            )}
            {w.mode === "sql" && !w.ready && (
              <View style={{ gap: 15 }}>
                <AlertBox>
                  {w.authLoading
                    ? "Anmeldung wird geprüft …"
                    : !w.user
                      ? "Für Ihre private Datenbank ist eine Anmeldung erforderlich. Demodaten sind weiterhin lokal verfügbar."
                      : "Datenbank wird geladen …"}
                </AlertBox>
                <View
                  style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}
                >
                  <Button
                    label={w.user ? "Erneut laden" : "Anmelden"}
                    icon="lock"
                    onPress={() => (w.user ? w.refresh() : void w.login())}
                  />
                  <Button
                    label="Demomodus nutzen"
                    variant="secondary"
                    onPress={() => void w.selectMode("demo")}
                  />
                </View>
              </View>
            )}
            {!w.ready && w.mode === "demo" ? (
              <ActivityIndicator color={C.orange} style={{ padding: 60 }} />
            ) : tab === "dashboard" ? (
              <Dashboard
                onNew={() => newOrder()}
                onOpen={openOrder}
                onOrders={openOrders}
                onCustomers={() => setTab("customers")}
              />
            ) : tab === "orders" ? (
              <OrdersPage
                onNew={() => newOrder()}
                onOpen={openOrder}
                initialFilter={filter}
              />
            ) : tab === "customers" ? (
              <CustomersPage
                onNew={() => setCustomerForm({})}
                onOpen={openCustomer}
              />
            ) : (
              <DataPage />
            )}
          </View>
        </ScrollView>
        {!sidebar && (
          <View
            style={{
              flexDirection: "row",
              paddingBottom: Math.max(insets.bottom, 5),
              backgroundColor: C.paper,
              borderTopWidth: 1,
              borderTopColor: C.line,
            }}
          >
            {navigation(true)}
          </View>
        )}
      </View>
      {w.toast ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: sidebar ? 25 : 95,
            left: sidebar ? 240 : 20,
            right: 20,
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: C.ink,
              borderRadius: 9,
              paddingVertical: 13,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Icon name="check-circle" color="#8BD2AD" size={17} />
            <Text style={{ color: "#fff", fontSize: 13 }}>{w.toast}</Text>
          </View>
        </View>
      ) : null}
      {orderForm && (
        <OrderForm
          order={orderForm.order}
          customerId={orderForm.customerId}
          onClose={() => setOrderForm(null)}
          onSaved={() => {
            setOrderForm(null);
            setTab("orders");
          }}
        />
      )}
      {orderId && (
        <OrderDetail
          orderId={orderId}
          onClose={() => setOrderId(null)}
          onEdit={(o) => {
            setOrderId(null);
            setOrderForm({ order: o });
          }}
          onCustomer={openCustomer}
        />
      )}
      {customerId && (
        <CustomerDetail
          customerId={customerId}
          onClose={() => setCustomerId(null)}
          onEdit={(c) => {
            setCustomerId(null);
            setReturnCustomer(c.id);
            setCustomerForm({ customer: c });
          }}
          onVehicle={(c, v) => {
            setCustomerId(null);
            setReturnCustomer(c.id);
            setVehicleForm({ customer: c, vehicle: v });
          }}
          onNewOrder={newOrder}
          onOrder={openOrder}
        />
      )}
      {customerForm && (
        <CustomerForm
          customer={customerForm.customer}
          onClose={() => {
            setCustomerForm(null);
            if (returnCustomer) setCustomerId(returnCustomer);
            setReturnCustomer(null);
          }}
          onSaved={(c) => {
            setCustomerForm(null);
            setCustomerId(c.id);
            setReturnCustomer(null);
          }}
        />
      )}
      {vehicleForm && (
        <VehicleForm
          customer={vehicleForm.customer}
          vehicle={vehicleForm.vehicle}
          onClose={() => {
            setVehicleForm(null);
            if (returnCustomer) setCustomerId(returnCustomer);
            setReturnCustomer(null);
          }}
          onSaved={(v) => {
            setVehicleForm(null);
            setCustomerId(v.customerId);
            setReturnCustomer(null);
          }}
        />
      )}
    </View>
  );
}
