import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createDemoData } from "../lib/demo-data";
import { trpc } from "../lib/trpc";
import { startOAuthLogin } from "../constants/oauth";
import {
  customerSchema,
  emptyData,
  normalizeWorkshopData,
  orderSchema,
  validateRelations,
  vehicleSchema,
  type Customer,
  type Order,
  type Vehicle,
  type WorkshopData,
} from "../shared/workshop";

const KEY = "auftragfix-demo-v1";
const MODE_KEY = "auftragfix-mode-v1";
type Mode = "demo" | "sql";
function useWorkshopState() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("demo");
  const [local, setLocal] = useState<WorkshopData>(emptyData);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const auth = trpc.auth.me.useQuery(undefined, { retry: false });
  const snapshot = trpc.workshop.snapshot.useQuery(undefined, {
    enabled: initialized && mode === "sql" && !!auth.data,
    retry: 1,
  });
  const customerMutation = trpc.workshop.saveCustomer.useMutation();
  const vehicleMutation = trpc.workshop.saveVehicle.useMutation();
  const orderMutation = trpc.workshop.saveOrder.useMutation();
  const deleteMutation = trpc.workshop.deleteOrder.useMutation();
  useEffect(() => {
    let alive = true;
    Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(MODE_KEY)])
      .then(async ([stored, storedMode]) => {
        if (!alive) return;
        if (stored) {
          const parsed = JSON.parse(stored) as WorkshopData;
          if (
            !Array.isArray(parsed.customers) ||
            !Array.isArray(parsed.vehicles) ||
            !Array.isArray(parsed.orders)
          )
            throw new Error("Lokale Daten konnten nicht gelesen werden.");
          const normalized = normalizeWorkshopData(parsed);
          await AsyncStorage.setItem(KEY, JSON.stringify(normalized));
          if (!alive) return;
          setLocal(normalized);
        } else {
          const initial = createDemoData();
          await AsyncStorage.setItem(KEY, JSON.stringify(initial));
          if (!alive) return;
          setLocal(initial);
        }
        if (storedMode === "sql") setMode("sql");
        setInitialized(true);
      })
      .catch(() => {
        if (alive) {
          setError(
            "Lokale Daten konnten nicht geladen werden. Bitte Datenmodus prüfen.",
          );
          setInitialized(true);
        }
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);
  const data = mode === "demo" ? local : (snapshot.data ?? emptyData);
  const ready =
    initialized && (mode === "demo" || (!!auth.data && snapshot.isSuccess));
  async function perform(action: () => Promise<void>, message: string) {
    setSaving(true);
    setError("");
    try {
      await action();
      setToast(message);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Speichern fehlgeschlagen. Bitte erneut versuchen.";
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }
  async function persist(next: WorkshopData) {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    setLocal(next);
  }
  function upsert<T extends { id: string }>(list: T[], item: T): T[] {
    return list.some((x) => x.id === item.id)
      ? list.map((x) => (x.id === item.id ? item : x))
      : [...list, item];
  }
  async function refreshSql() {
    const result = await snapshot.refetch();
    if (result.error)
      setError(
        "Gespeichert, aber die Ansicht konnte nicht aktualisiert werden. Bitte neu laden.",
      );
  }
  async function saveCustomer(value: Customer) {
    const c = customerSchema.parse(value);
    await perform(async () => {
      if (mode === "demo")
        await persist({ ...local, customers: upsert(local.customers, c) });
      else {
        await customerMutation.mutateAsync(c);
        await refreshSql();
      }
    }, "Kunde gespeichert");
  }
  async function saveVehicle(value: Vehicle) {
    const v = vehicleSchema.parse(value);
    if (!data.customers.some((c) => c.id === v.customerId))
      throw new Error("Bitte zuerst den Kunden speichern.");
    await perform(async () => {
      if (mode === "demo")
        await persist({ ...local, vehicles: upsert(local.vehicles, v) });
      else {
        await vehicleMutation.mutateAsync(v);
        await refreshSql();
      }
    }, "Fahrzeug gespeichert");
  }
  async function saveOrder(value: Order) {
    const o = orderSchema.parse(value);
    if (!validateRelations(data, o))
      throw new Error(
        "Bitte einen Kunden und ein zugehöriges Fahrzeug auswählen.",
      );
    await perform(async () => {
      if (mode === "demo")
        await persist({ ...local, orders: upsert(local.orders, o) });
      else {
        await orderMutation.mutateAsync(o);
        await refreshSql();
      }
    }, "Auftrag gespeichert");
  }
  async function deleteOrder(id: string) {
    await perform(async () => {
      if (mode === "demo")
        await persist({
          ...local,
          orders: local.orders.filter((o) => o.id !== id),
        });
      else {
        await deleteMutation.mutateAsync({ id });
        await refreshSql();
      }
    }, "Auftrag gelöscht");
  }
  async function selectMode(next: Mode) {
    setError("");
    try {
      if (next === "sql") {
        const session = await auth.refetch();
        if (!session.data) {
          await AsyncStorage.setItem(MODE_KEY, "sql");
          await startOAuthLogin();
          return;
        }
      }
      await AsyncStorage.setItem(MODE_KEY, next);
      setMode(next);
      setToast(
        next === "sql"
          ? "Private Datenbank ausgewählt"
          : "Lokaler Demomodus ausgewählt",
      );
    } catch {
      setError(
        "Anmeldung oder Moduswechsel fehlgeschlagen. Bitte erneut versuchen.",
      );
    }
  }
  async function login() {
    try {
      await AsyncStorage.setItem(MODE_KEY, "sql");
      await startOAuthLogin();
    } catch {
      setError("Die Anmeldung konnte nicht geöffnet werden.");
    }
  }
  async function logout() {
    try {
      await trpcClientLogout();
      queryClient.clear();
      await AsyncStorage.setItem(MODE_KEY, "demo");
      setMode("demo");
      setToast("Abgemeldet – Demomodus ausgewählt");
      await auth.refetch();
    } catch {
      setError("Abmelden fehlgeschlagen. Bitte erneut versuchen.");
    }
  }
  const logoutMutation = trpc.auth.logout.useMutation();
  async function trpcClientLogout() {
    await logoutMutation.mutateAsync();
    const Auth = await import("../lib/_core/auth");
    await Auth.removeSessionToken();
    await Auth.clearUserInfo();
  }
  return {
    data,
    mode,
    ready,
    saving,
    toast,
    error: error || (mode === "sql" ? (snapshot.error?.message ?? "") : ""),
    user: auth.data,
    authLoading: auth.isLoading,
    login,
    logout,
    selectMode,
    saveCustomer,
    saveVehicle,
    saveOrder,
    deleteOrder,
    notify: setToast,
    clearError: () => setError(""),
    refresh: () => {
      void snapshot.refetch();
    },
  };
}
type WorkshopContext = ReturnType<typeof useWorkshopState>;
const Context = createContext<WorkshopContext | null>(null);
export function WorkshopProvider({ children }: { children: ReactNode }) {
  const state = useWorkshopState();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useWorkshop(): WorkshopContext {
  const value = useContext(Context);
  if (!value) throw new Error("WorkshopProvider fehlt");
  return value;
}
