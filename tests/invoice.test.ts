import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { buildInvoicePdf } from "../lib/invoice-pdf";
import {
  calculateInvoiceTotals,
  createInvoiceModel,
  invoiceFilename,
  invoiceOptionsSchema,
  parseTaxRate,
  workshopProfileSchema,
} from "../shared/invoice";
import {
  csvExport,
  customerSchema,
  jsonExport,
  MAX_AMOUNT_CENTS,
  normalizeOrder,
  normalizeWorkshopData,
  sqlExport,
} from "../shared/workshop";
import { invoiceFixture } from "./invoice-fixture";

const fonts = {
  regular: new Uint8Array(readFileSync("assets/fonts/DejaVuSans.ttf")),
  bold: new Uint8Array(readFileSync("assets/fonts/DejaVuSans-Bold.ttf")),
};

describe("PDF-Rechnungsberechnung", () => {
  it("verarbeitet ausdrücklich eingegebene deutsche Steuersätze ohne Rundungsverlust", () => {
    expect(parseTaxRate("19")).toBe(1900);
    expect(parseTaxRate("7,5")).toBe(750);
    expect(parseTaxRate("19.00")).toBe(1900);
    for (const value of ["", "-1", "19,000", "x", "100,01"])
      expect(Number.isNaN(parseTaxRate(value))).toBe(true);
  });
  it("addiert bei Nettopreisen die Steuer auf die gespeicherten Verkaufspreise", () => {
    const base = 12345;
    const tax = Math.round((base * 1900) / 10000);
    expect(calculateInvoiceTotals(base, "net", 1900)).toEqual({
      baseCents: base,
      netCents: base,
      taxCents: tax,
      totalCents: base + tax,
    });
  });
  it("weist bei Bruttopreisen enthaltene Steuer aus, ohne den Gesamtbetrag zu erhöhen", () => {
    const net = 10000;
    const tax = Math.round((net * 1900) / 10000);
    const gross = net + tax;
    expect(calculateInvoiceTotals(gross, "gross", 1900)).toEqual({
      baseCents: gross,
      netCents: net,
      taxCents: tax,
      totalCents: gross,
    });
  });
  it.each([0, 1, 29, 19999, MAX_AMOUNT_CENTS])(
    "erhält die Cent-Summen für %i Cent",
    (base) => {
      for (const mode of ["net", "gross", "none"] as const) {
        const t = calculateInvoiceTotals(base, mode, 1900);
        expect(t.netCents + t.taxCents).toBe(t.totalCents);
        expect(Number.isInteger(t.taxCents)).toBe(true);
        if (mode !== "net") expect(t.totalCents).toBe(base);
      }
    },
  );
  it("verlangt einen eigenen Hinweis ohne USt-Ausweis und nimmt keine Preisbasis an", () => {
    const { options } = invoiceFixture();
    expect(
      invoiceOptionsSchema.safeParse({
        ...options,
        taxMode: "none",
        taxNote: "",
      }).success,
    ).toBe(false);
    expect(
      invoiceOptionsSchema.safeParse({ ...options, taxMode: "" }).success,
    ).toBe(false);
    expect(calculateInvoiceTotals(12345, "none", 1900).taxCents).toBe(0);
  });
  it("verlangt Rechnungsnummer, gültige Daten und die beiden Anschriften", () => {
    const { options, profile } = invoiceFixture();
    for (const value of [
      { number: "" },
      { invoiceDate: "2026-02-30" },
      { serviceDate: "" },
      { recipientAddress: "" },
      { dueDate: "2000-01-01" },
    ])
      expect(
        invoiceOptionsSchema.safeParse({ ...options, ...value }).success,
      ).toBe(false);
    expect(
      workshopProfileSchema.safeParse({ ...profile, address: "" }).success,
    ).toBe(false);
    expect(invoiceFilename("../RE/2026:01")).not.toContain("/");
  });
  it("übernimmt nur Verkaufspreise und lässt alle internen Informationen weg", () => {
    const f = invoiceFixture();
    const model = createInvoiceModel(
      {
        ...f.order,
        damages: "INTERN_SCHADEN",
        measurements: [{ label: "INTERN_MESSWERT", value: "1", unit: "mm" }],
      },
      { ...f.customer, notes: "INTERN_KUNDENNOTIZ" },
      f.vehicle,
      f.profile,
      f.options,
      true,
    );
    expect(model.lines.reduce((s, p) => s + p.totalCents, 0)).toBe(
      f.order.priceCents,
    );
    expect(model.lines[0].unitPriceCents).toBe(f.order.parts[0].saleCents);
    const serialized = JSON.stringify(model);
    for (const key of [
      "purchaseCents",
      "costCents",
      "marginCents",
      "otherCostCents",
      "INTERN_SCHADEN",
      "INTERN_MESSWERT",
      "INTERN_KUNDENNOTIZ",
    ])
      expect(serialized).not.toContain(key);
  });
  it("weist falsche Kunden-Fahrzeug-Verknüpfungen zurück", () => {
    const f = invoiceFixture();
    expect(() =>
      createInvoiceModel(
        f.order,
        { ...f.customer, id: "fremd" },
        f.vehicle,
        f.profile,
        f.options,
        false,
      ),
    ).toThrow();
  });
  it("erhält alte Kunden ohne Adresse und exportiert die neue Adresse vollständig", () => {
    const f = invoiceFixture();
    const { address: _address, ...old } = f.customer;
    expect(customerSchema.parse(old).address).toBe("");
    const data = normalizeWorkshopData({ ...f.data, customers: [old] });
    expect(data.customers[0]).toEqual({ ...old, address: "" });
    f.data.customers[0] = f.customer;
    expect(csvExport(f.data)).toContain("Kundenadresse");
    expect(csvExport(f.data)).toContain("Musterweg 3");
    expect(JSON.parse(jsonExport(f.data)).schemaVersion).toBe(3);
    expect(sqlExport(f.data)).toContain("address TEXT NOT NULL");
    expect(sqlExport(f.data)).toContain("Musterweg 3");
  });
});

describe("Echte A4-PDF", () => {
  it("erzeugt eine ladbare PDF mit eingebetteter Schrift und Umlauten", async () => {
    const bytes = await buildInvoicePdf(invoiceFixture().model, fonts);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
    expect(pdf.getTitle()).toContain("MUSTER-2026-001");
    expect(pdf.getPages()[0].getWidth()).toBeCloseTo(595.28, 1);
  });
  it("bricht viele Ersatzteile und lange Leistungen auf mehrere Seiten um", async () => {
    const f = invoiceFixture();
    const order = normalizeOrder({
      ...f.order,
      parts: Array.from({ length: 100 }, (_, i) => ({
        id: `teil-${i}`,
        description: `Muster-Ersatzteil ${i + 1} mit längerer Beschreibung für einen nachvollziehbaren mehrseitigen Umbruch`,
        quantity: 2,
        purchaseCents: 10,
        saleCents: 29,
      })),
      services: Array.from(
        { length: 60 },
        (_, i) =>
          `Leistung ${i + 1}: Prüfarbeit am fiktiven Fahrzeug durchgeführt.`,
      ).join("\n"),
      servicePriceCents: 123,
      otherCostCents: 0,
    });
    const model = createInvoiceModel(
      order,
      f.customer,
      f.vehicle,
      f.profile,
      { ...f.options, number: "W".repeat(60) },
      true,
    );
    const pdf = await PDFDocument.load(await buildInvoicePdf(model, fonts));
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(3);
  }, 20000);
  it("meldet nicht unterstützte Schriftzeichen, statt Kundennamen stillschweigend zu verändern", async () => {
    const f = invoiceFixture();
    await expect(
      buildInvoicePdf(
        { ...f.model, recipient: { ...f.model.recipient, name: "Test 🚗" } },
        fonts,
      ),
    ).rejects.toThrow("Schrift unterstützt");
  });
});
