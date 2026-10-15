import { z } from "zod";

export const statuses = ["new", "working", "done"] as const;
export type OrderStatus = (typeof statuses)[number];
export const statusLabels: Record<OrderStatus, string> = {
  new: "Neu",
  working: "In Arbeit",
  done: "Fertig",
};
export const dateSchema = z
  .string()
  .refine(isCalendarDate, "Bitte ein gültiges Datum eingeben (TT.MM.JJJJ).");
const id = z.string().min(1).max(64);
export const customerSchema = z.object({
  id,
  name: z.string().trim().min(2, "Bitte den Kundennamen eingeben.").max(160),
  phone: z.string().trim().min(5, "Bitte eine Telefonnummer eingeben.").max(50),
  address: z.string().trim().max(1000).default(""),
  email: z
    .string()
    .trim()
    .max(200)
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "E-Mail-Adresse ist ungültig.",
    ),
  notes: z.string().max(4000),
});
export const vehicleSchema = z.object({
  id,
  customerId: id,
  plate: z.string().trim().min(2, "Bitte das Kennzeichen eingeben.").max(24),
  make: z.string().trim().min(1, "Bitte eine Marke eingeben.").max(80),
  model: z.string().trim().min(1, "Bitte ein Modell eingeben.").max(120),
  year: z
    .string()
    .refine(
      (v) => !v || (/^\d{4}$/.test(v) && +v >= 1900 && +v <= 2100),
      "Baujahr ist ungültig.",
    ),
  vin: z.string().max(40),
  mileage: z.number().int().min(0).max(9999999),
  fuel: z.string().max(40),
});
export const measurementSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Messwert benötigt eine Bezeichnung.")
    .max(120),
  value: z.string().trim().min(1, "Messwert benötigt einen Wert.").max(80),
  unit: z.string().max(30),
});
export const MAX_AMOUNT_CENTS = 999999999;
const amountSchema = z.number().int().min(0).max(MAX_AMOUNT_CENTS);
export const partSchema = z.object({
  id,
  description: z
    .string()
    .trim()
    .min(1, "Bitte das Ersatzteil benennen.")
    .max(160),
  quantity: z
    .number()
    .int("Menge muss eine ganze Zahl sein.")
    .min(1, "Menge muss mindestens 1 sein.")
    .max(9999),
  purchaseCents: amountSchema,
  saleCents: amountSchema,
});
export type Part = z.infer<typeof partSchema>;
export function calculateOrderTotals(
  parts: readonly Part[],
  otherCostCents = 0,
  servicePriceCents = 0,
) {
  const partsCostCents = parts.reduce(
    (sum, p) => sum + p.quantity * p.purchaseCents,
    0,
  );
  const partsPriceCents = parts.reduce(
    (sum, p) => sum + p.quantity * p.saleCents,
    0,
  );
  const costCents = partsCostCents + otherCostCents;
  const priceCents = partsPriceCents + servicePriceCents;
  return {
    partsCostCents,
    partsPriceCents,
    costCents,
    priceCents,
    marginCents: priceCents - costCents,
  };
}
export const orderSchema = z
  .object({
    id,
    customerId: id,
    vehicleId: id,
    number: z.string().min(1).max(40),
    title: z
      .string()
      .trim()
      .min(2, "Bitte eine Auftragsbezeichnung eingeben.")
      .max(160),
    receivedDate: dateSchema,
    deadline: dateSchema,
    completedDate: z
      .string()
      .refine(
        (v) => !v || isCalendarDate(v),
        "Fertigstellungsdatum ist ungültig.",
      ),
    status: z.enum(statuses),
    damages: z.string().max(10000),
    services: z
      .string()
      .trim()
      .min(2, "Bitte mindestens eine Leistung beschreiben.")
      .max(10000),
    measurements: z.array(measurementSchema).max(100),
    parts: z
      .array(partSchema)
      .max(100, "Maximal 100 Ersatzteilpositionen je Auftrag.")
      .default([]),
    otherCostCents: amountSchema.optional(),
    servicePriceCents: amountSchema.optional(),
    costCents: amountSchema,
    priceCents: amountSchema,
  })
  .superRefine((v, ctx) => {
    if (v.deadline < v.receivedDate)
      ctx.addIssue({
        code: "custom",
        path: ["deadline"],
        message: "Die Deadline darf nicht vor dem Eingang liegen.",
      });
    if (v.status === "done" && !v.completedDate)
      ctx.addIssue({
        code: "custom",
        path: ["completedDate"],
        message: "Bitte das Fertigstellungsdatum eingeben.",
      });
    if (v.completedDate && v.completedDate < v.receivedDate)
      ctx.addIssue({
        code: "custom",
        path: ["completedDate"],
        message: "Fertigstellung darf nicht vor dem Eingang liegen.",
      });
    const totals = calculateOrderTotals(
      v.parts,
      v.otherCostCents ?? v.costCents,
      v.servicePriceCents ?? v.priceCents,
    );
    if (totals.costCents > MAX_AMOUNT_CENTS)
      ctx.addIssue({
        code: "custom",
        path: ["costCents"],
        message: "Die berechneten Gesamtkosten sind zu hoch.",
      });
    if (totals.priceCents > MAX_AMOUNT_CENTS)
      ctx.addIssue({
        code: "custom",
        path: ["priceCents"],
        message: "Der berechnete Gesamtpreis ist zu hoch.",
      });
    if (new Set(v.parts.map((p) => p.id)).size !== v.parts.length)
      ctx.addIssue({
        code: "custom",
        path: ["parts"],
        message: "Ersatzteilpositionen benötigen unterschiedliche IDs.",
      });
  })
  .transform((v) => {
    const otherCostCents = v.otherCostCents ?? v.costCents;
    const servicePriceCents = v.servicePriceCents ?? v.priceCents;
    const totals = calculateOrderTotals(
      v.parts,
      otherCostCents,
      servicePriceCents,
    );
    return {
      ...v,
      otherCostCents,
      servicePriceCents,
      costCents: totals.costCents,
      priceCents: totals.priceCents,
    };
  });
export type Customer = z.infer<typeof customerSchema>;
export type Vehicle = z.infer<typeof vehicleSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderInput = z.input<typeof orderSchema>;
export function normalizeOrder(value: OrderInput): Order {
  return orderSchema.parse(value);
}
export type WorkshopData = {
  customers: Customer[];
  vehicles: Vehicle[];
  orders: Order[];
};
export function normalizeWorkshopData(data: {
  customers: z.input<typeof customerSchema>[];
  vehicles: Vehicle[];
  orders: OrderInput[];
}): WorkshopData {
  return {
    ...data,
    customers: data.customers.map((c) => customerSchema.parse(c)),
    orders: data.orders.map(normalizeOrder),
  };
}
export const emptyData: WorkshopData = {
  customers: [],
  vehicles: [],
  orders: [],
};

export function isCalendarDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dateInput(v: string): string {
  return v ? v.split("-").reverse().join(".") : "";
}
export function parseDateInput(v: string): string {
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(v.trim()))
    return v.trim().split(".").reverse().join("-");
  return v.trim();
}
export function dayLabel(v: string): string {
  return v
    ? new Date(v + "T12:00:00").toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "short",
      })
    : "–";
}
export function isOverdue(o: Order, today = localToday()): boolean {
  return o.status !== "done" && o.deadline < today;
}
export function money(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}
export function parseMoney(v: string): number {
  const clean = v.trim().replace(/\s|€/g, "");
  if (!clean) return 0;
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : clean;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return NaN;
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : NaN;
}
export function moneyInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
export function newId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 3) | 8).toString(16);
  });
}
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
export function validateRelations(data: WorkshopData, o: Order): boolean {
  return (
    !!data.customers.find((c) => c.id === o.customerId) &&
    !!data.vehicles.find(
      (v) => v.id === o.vehicleId && v.customerId === o.customerId,
    )
  );
}
function csvCell(v: unknown): string {
  let s = String(v ?? "");
  // Spreadsheet formula injection protection for customer-entered text.
  if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}
export function csvExport(data: WorkshopData): string {
  const header = [
    "Auftrags-ID",
    "Auftragsnummer",
    "Kunden-ID",
    "Kundenname",
    "Telefon",
    "Kundenadresse",
    "E-Mail",
    "Fahrzeug-ID",
    "Kennzeichen",
    "Marke",
    "Modell",
    "Baujahr",
    "FIN",
    "Kilometerstand",
    "Kraftstoff",
    "Auftrag",
    "Eingang",
    "Deadline",
    "Fertigstellung",
    "Status",
    "Schäden",
    "Leistungen",
    "Messwerte_JSON",
    "Ersatzteile_JSON",
    "Teile_Einkauf_EUR",
    "Teile_Verkauf_EUR",
    "Weitere_Kosten_EUR",
    "Arbeitslohn_Leistungen_EUR",
    "Eigene_Kosten_EUR",
    "Preis_EUR",
    "Differenz_EUR",
  ];
  const rows = data.orders.map(normalizeOrder).map((o) => {
    const c = data.customers.find((c) => c.id === o.customerId);
    const v = data.vehicles.find((v) => v.id === o.vehicleId);
    const totals = calculateOrderTotals(
      o.parts,
      o.otherCostCents,
      o.servicePriceCents,
    );
    return [
      o.id,
      o.number,
      o.customerId,
      c?.name,
      c?.phone,
      c?.address,
      c?.email,
      o.vehicleId,
      v?.plate,
      v?.make,
      v?.model,
      v?.year,
      v?.vin,
      v?.mileage,
      v?.fuel,
      o.title,
      o.receivedDate,
      o.deadline,
      o.completedDate,
      statusLabels[o.status],
      o.damages,
      o.services,
      JSON.stringify(o.measurements),
      JSON.stringify(o.parts),
      moneyInput(totals.partsCostCents),
      moneyInput(totals.partsPriceCents),
      moneyInput(o.otherCostCents),
      moneyInput(o.servicePriceCents),
      moneyInput(o.costCents),
      moneyInput(o.priceCents),
      moneyInput(o.priceCents - o.costCents),
    ];
  });
  return (
    "\uFEFF" +
    [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n")
  );
}
export function jsonExport(data: WorkshopData): string {
  return JSON.stringify(
    {
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      currency: "EUR",
      moneyUnit: "cents",
      ...data,
      orders: data.orders.map(normalizeOrder),
    },
    null,
    2,
  );
}
// MySQL string literals, including backslash escaping under default SQL mode.
export function sqlString(v: string): string {
  return (
    "'" +
    v
      .replace(/\\/g, "\\\\")
      .replace(/\0/g, "\\0")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/'/g, "''") +
    "'"
  );
}
export function sqlExport(data: WorkshopData): string {
  const q = sqlString;
  const lines = [
    "-- AuftragFix: eigenständiger MySQL 8 Export (UTF-8)",
    "-- Schema 3: Kundenadresse, Ersatzteilpositionen und automatisch berechnete Summen.",
    "-- In eine neue/leere Datenbank importieren. Kein DROP, keine automatische Überschreibung.",
    "-- Geldbeträge sind ganze Cent; Kundendaten vertraulich behandeln.",
    "SET NAMES utf8mb4;",
    "SET @auftragfix_old_sql_mode = @@SESSION.sql_mode;",
    "SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';",
    "CREATE TABLE IF NOT EXISTS customers (id VARCHAR(64) PRIMARY KEY, name VARCHAR(160) NOT NULL, phone VARCHAR(50) NOT NULL, address TEXT NOT NULL, email VARCHAR(200) NOT NULL, notes TEXT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
    "CREATE TABLE IF NOT EXISTS vehicles (id VARCHAR(64) PRIMARY KEY, customer_id VARCHAR(64) NOT NULL, plate VARCHAR(24) NOT NULL, make VARCHAR(80) NOT NULL, model VARCHAR(120) NOT NULL, year VARCHAR(4) NOT NULL, vin VARCHAR(40) NOT NULL, mileage INT NOT NULL, fuel VARCHAR(40) NOT NULL, FOREIGN KEY (customer_id) REFERENCES customers(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
    "CREATE TABLE IF NOT EXISTS orders (id VARCHAR(64) PRIMARY KEY, customer_id VARCHAR(64) NOT NULL, vehicle_id VARCHAR(64) NOT NULL, number VARCHAR(40) NOT NULL, title VARCHAR(160) NOT NULL, received_date DATE NOT NULL, deadline DATE NOT NULL, completed_date DATE NULL, status VARCHAR(20) NOT NULL, damages TEXT NOT NULL, services TEXT NOT NULL, measurements JSON NOT NULL, parts JSON NOT NULL, other_cost_cents INT NOT NULL, service_price_cents INT NOT NULL, cost_cents INT NOT NULL, price_cents INT NOT NULL, FOREIGN KEY (customer_id) REFERENCES customers(id), FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
    "START TRANSACTION;",
  ];
  for (const c of data.customers)
    lines.push(
      `INSERT INTO customers (id,name,phone,address,email,notes) VALUES (${[c.id, c.name, c.phone, c.address ?? "", c.email, c.notes].map(q).join(",")});`,
    );
  for (const v of data.vehicles)
    lines.push(
      `INSERT INTO vehicles (id,customer_id,plate,make,model,year,vin,mileage,fuel) VALUES (${[v.id, v.customerId, v.plate, v.make, v.model, v.year, v.vin].map(q).join(",")},${v.mileage},${q(v.fuel)});`,
    );
  for (const o of data.orders.map(normalizeOrder))
    lines.push(
      `INSERT INTO orders (id,customer_id,vehicle_id,number,title,received_date,deadline,completed_date,status,damages,services,measurements,parts,other_cost_cents,service_price_cents,cost_cents,price_cents) VALUES (${[o.id, o.customerId, o.vehicleId, o.number, o.title, o.receivedDate, o.deadline].map(q).join(",")},${o.completedDate ? q(o.completedDate) : "NULL"},${[o.status, o.damages, o.services, JSON.stringify(o.measurements), JSON.stringify(o.parts)].map(q).join(",")},${o.otherCostCents},${o.servicePriceCents},${o.costCents},${o.priceCents});`,
    );
  lines.push("COMMIT;", "SET SESSION sql_mode = @auftragfix_old_sql_mode;", "");
  return lines.join("\n");
}
