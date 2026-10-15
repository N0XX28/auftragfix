import { z } from "zod";
import {
  customerSchema,
  dateSchema,
  isCalendarDate,
  normalizeOrder,
  vehicleSchema,
  type Customer,
  type Order,
  type Vehicle,
} from "./workshop";

export const taxModes = ["net", "gross", "none"] as const;
export type TaxMode = (typeof taxModes)[number];
export const workshopProfileSchema = z.object({
  name: z.string().trim().min(2, "Bitte den Werkstattnamen eingeben.").max(160),
  address: z
    .string()
    .trim()
    .min(5, "Bitte die Werkstattanschrift eingeben.")
    .max(1000),
  contact: z.string().trim().max(300),
  taxIdentifier: z.string().trim().max(100),
  iban: z.string().trim().max(80),
  bic: z.string().trim().max(30),
});
export type WorkshopProfile = z.infer<typeof workshopProfileSchema>;
export const emptyWorkshopProfile: WorkshopProfile = {
  name: "",
  address: "",
  contact: "",
  taxIdentifier: "",
  iban: "",
  bic: "",
};
export const invoiceOptionsSchema = z
  .object({
    number: z
      .string()
      .trim()
      .min(1, "Bitte eine Rechnungsnummer eingeben.")
      .max(60)
      .refine(
        (v) => !/[\u0000-\u001f]/.test(v),
        "Rechnungsnummer enthält ungültige Zeichen.",
      ),
    invoiceDate: dateSchema,
    serviceDate: dateSchema,
    recipientAddress: z
      .string()
      .trim()
      .min(5, "Bitte die Kundenanschrift eingeben.")
      .max(1000),
    dueDate: z
      .string()
      .refine((v) => !v || isCalendarDate(v), "Zahlungsfrist ist ungültig."),
    taxMode: z.enum(taxModes),
    rateBasisPoints: z.number().int().min(0).max(10000),
    taxNote: z.string().trim().max(2000),
    paymentNote: z.string().trim().max(2000),
  })
  .superRefine((v, ctx) => {
    if (v.dueDate && v.dueDate < v.invoiceDate)
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Zahlungsfrist darf nicht vor dem Rechnungsdatum liegen.",
      });
    if (v.taxMode === "none" && !v.taxNote)
      ctx.addIssue({
        code: "custom",
        path: ["taxNote"],
        message: "Bitte Ihren Hinweis zum fehlenden USt-Ausweis eintragen.",
      });
  });
export type InvoiceOptions = z.infer<typeof invoiceOptionsSchema>;
export function parseTaxRate(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalized)) return NaN;
  const [whole, fraction = ""] = normalized.split(".");
  const basisPoints = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return basisPoints <= 10000 ? basisPoints : NaN;
}
export function calculateInvoiceTotals(
  baseCents: number,
  mode: TaxMode,
  rateBasisPoints: number,
) {
  if (
    !Number.isSafeInteger(baseCents) ||
    baseCents < 0 ||
    !Number.isInteger(rateBasisPoints) ||
    rateBasisPoints < 0 ||
    rateBasisPoints > 10000
  )
    throw new Error("Ungültige Rechnungsbeträge.");
  if (mode === "none")
    return {
      baseCents,
      netCents: baseCents,
      taxCents: 0,
      totalCents: baseCents,
    };
  if (mode === "net") {
    const taxCents = Math.round((baseCents * rateBasisPoints) / 10000);
    return {
      baseCents,
      netCents: baseCents,
      taxCents,
      totalCents: baseCents + taxCents,
    };
  }
  const netCents = Math.round((baseCents * 10000) / (10000 + rateBasisPoints));
  return {
    baseCents,
    netCents,
    taxCents: baseCents - netCents,
    totalCents: baseCents,
  };
}
export type InvoiceLine = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};
export type InvoiceModel = {
  workshop: WorkshopProfile;
  options: InvoiceOptions;
  recipient: { name: string; address: string; phone: string; email: string };
  vehicle: {
    make: string;
    model: string;
    plate: string;
    vin: string;
    mileage: number;
  };
  orderNumber: string;
  orderTitle: string;
  lines: InvoiceLine[];
  services: string[];
  totals: ReturnType<typeof calculateInvoiceTotals>;
  isDemo: boolean;
};
export function createInvoiceModel(
  order: Order,
  customer: Customer,
  vehicle: Vehicle,
  profile: WorkshopProfile,
  options: InvoiceOptions,
  isDemo: boolean,
): InvoiceModel {
  const o = normalizeOrder(order),
    c = customerSchema.parse(customer),
    v = vehicleSchema.parse(vehicle);
  const workshop = workshopProfileSchema.parse(profile),
    settings = invoiceOptionsSchema.parse(options);
  if (o.customerId !== c.id || o.vehicleId !== v.id || v.customerId !== c.id)
    throw new Error("Kunde und Fahrzeug passen nicht zum Auftrag.");
  const lines: InvoiceLine[] = o.parts.map((p) => ({
    description: p.description,
    quantity: p.quantity,
    unitPriceCents: p.saleCents,
    totalCents: p.quantity * p.saleCents,
  }));
  if (o.servicePriceCents || !lines.length)
    lines.push({
      description: "Arbeitslohn / Leistungen",
      quantity: 1,
      unitPriceCents: o.servicePriceCents,
      totalCents: o.servicePriceCents,
    });
  return {
    workshop,
    options: settings,
    recipient: {
      name: c.name,
      address: settings.recipientAddress,
      phone: c.phone,
      email: c.email,
    },
    vehicle: {
      make: v.make,
      model: v.model,
      plate: v.plate,
      vin: v.vin,
      mileage: v.mileage,
    },
    orderNumber: o.number,
    orderTitle: o.title,
    lines,
    services: o.services
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    totals: calculateInvoiceTotals(
      o.priceCents,
      settings.taxMode,
      settings.rateBasisPoints,
    ),
    isDemo,
  };
}
export function invoiceFilename(number: string): string {
  const safe =
    number
      .replace(/[^A-Za-z0-9._-]/g, "-")
      .replace(/^[.-]+/, "")
      .slice(0, 60) || "Rechnung";
  return `Rechnung-${safe}.pdf`;
}
