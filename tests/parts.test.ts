import { describe, expect, it } from "vitest";
import { createDemoData } from "../lib/demo-data";
import { draftToPart, partToDraft } from "../shared/parts-form";
import {
  calculateOrderTotals,
  csvExport,
  jsonExport,
  MAX_AMOUNT_CENTS,
  normalizeOrder,
  normalizeWorkshopData,
  orderSchema,
  partSchema,
  sqlExport,
  type OrderInput,
  type Part,
} from "../shared/workshop";

const parts: Part[] = [
  {
    id: "part-a",
    description: "Bremsscheibe",
    quantity: 2,
    purchaseCents: 6900,
    saleCents: 9900,
  },
  {
    id: "part-b",
    description: "Filter",
    quantity: 3,
    purchaseCents: 29,
    saleCents: 59,
  },
];
const order = () => ({
  ...createDemoData().orders[0],
  parts,
  otherCostCents: 700,
  servicePriceCents: 4200,
});

describe("Mehrere Ersatzteilpreise", () => {
  it("berechnet Einkauf, Verkauf und Auftragssummen unter Berücksichtigung der Menge", () => {
    const t = calculateOrderTotals(parts, 700, 4200);
    expect(t.partsCostCents).toBe(2 * 6900 + 3 * 29);
    expect(t.partsPriceCents).toBe(2 * 9900 + 3 * 59);
    expect(t.costCents).toBe(2 * 6900 + 3 * 29 + 700);
    expect(t.priceCents).toBe(2 * 9900 + 3 * 59 + 4200);
    expect(t.marginCents).toBe(t.priceCents - t.costCents);
  });
  it("ändert Summen beim Bearbeiten und Entfernen einer Position", () => {
    const edited = parts.map((p) => ({ ...p, quantity: 4 }));
    expect(calculateOrderTotals(edited).partsCostCents).toBe(4 * 6900 + 4 * 29);
    expect(calculateOrderTotals(parts.slice(1), 700, 4200).costCents).toBe(
      3 * 29 + 700,
    );
    expect(calculateOrderTotals([], 700, 4200)).toEqual({
      partsCostCents: 0,
      partsPriceCents: 0,
      costCents: 700,
      priceCents: 4200,
      marginCents: 4200 - 700,
    });
  });
  it("kann ausschließlich Ersatzteile ohne weitere Basisbeträge kalkulieren", () => {
    const result = normalizeOrder({
      ...order(),
      otherCostCents: 0,
      servicePriceCents: 0,
    });
    expect(result.costCents).toBe(2 * 6900 + 3 * 29);
    expect(result.priceCents).toBe(2 * 9900 + 3 * 59);
  });
  it("rechnet übermittelte Gesamtsummen aus den Einzelwerten neu aus", () => {
    const result = orderSchema.parse({
      ...order(),
      costCents: 1,
      priceCents: 2,
    });
    expect(result.costCents).toBe(2 * 6900 + 3 * 29 + 700);
    expect(result.priceCents).toBe(2 * 9900 + 3 * 59 + 4200);
    expect(normalizeOrder(result)).toEqual(result);
  });
  it("erhält Kosten und Preise alter Aufträge ohne neue Felder unverändert", () => {
    const original = createDemoData().orders[1];
    const {
      parts: _parts,
      otherCostCents: _other,
      servicePriceCents: _service,
      ...legacy
    } = original;
    const result = normalizeOrder(legacy);
    expect(result.parts).toEqual([]);
    expect(result.otherCostCents).toBe(original.costCents);
    expect(result.servicePriceCents).toBe(original.priceCents);
    expect(result.costCents).toBe(original.costCents);
    expect(result.priceCents).toBe(original.priceCents);
    expect(result.id).toBe(original.id);
    const data = createDemoData();
    const migrated = normalizeWorkshopData({ ...data, orders: [legacy] });
    expect(migrated.customers).toEqual(data.customers);
    expect(migrated.vehicles).toEqual(data.vehicles);
    expect(migrated.orders[0]).toEqual(result);
  });
  it("verhindert leere Bezeichnungen, negative Preise und ungültige Mengen", () => {
    for (const quantity of [0, -1, 1.5, NaN, 10000])
      expect(partSchema.safeParse({ ...parts[0], quantity }).success).toBe(
        false,
      );
    expect(
      partSchema.safeParse({ ...parts[0], description: " " }).success,
    ).toBe(false);
    expect(
      partSchema.safeParse({ ...parts[0], purchaseCents: -1 }).success,
    ).toBe(false);
    expect(partSchema.safeParse({ ...parts[0], saleCents: NaN }).success).toBe(
      false,
    );
  });
  it("verhindert zu große Gesamtbeträge und doppelte Positions-IDs", () => {
    expect(
      orderSchema.safeParse({
        ...order(),
        parts: [{ ...parts[0], purchaseCents: MAX_AMOUNT_CENTS, quantity: 2 }],
      }).success,
    ).toBe(false);
    expect(
      orderSchema.safeParse({ ...order(), parts: [parts[0], parts[0]] })
        .success,
    ).toBe(false);
    expect(
      orderSchema.safeParse({
        ...order(),
        parts: Array.from({ length: 101 }, (_, i) => ({
          ...parts[0],
          id: String(i),
        })),
      }).success,
    ).toBe(false);
  });
  it("erlaubt eine negative Differenz ohne negative Einzelpreise", () => {
    const result = normalizeOrder({
      ...order(),
      parts: [{ ...parts[0], purchaseCents: 2000, saleCents: 1000 }],
      otherCostCents: 0,
      servicePriceCents: 0,
    });
    expect(result.priceCents - result.costCents).toBe(2 * 1000 - 2 * 2000);
  });
});

describe("Eingabe und Speicherung", () => {
  it("erhält deutsche Cent-Beträge und stabile IDs im Formular-Rundlauf", () => {
    expect(draftToPart(partToDraft(parts[1]))).toEqual(parts[1]);
    const result = draftToPart({
      id: "draft",
      description: "Filter",
      quantity: "3",
      purchase: "0,29",
      sale: "1.234,56",
    });
    expect(result.purchaseCents).toBe(29);
    expect(result.saleCents).toBe(123456);
    expect(result.quantity).toBe(3);
    for (const quantity of ["", "1,5", "1.5", "-1", "x"])
      expect(
        Number.isNaN(
          draftToPart({ ...partToDraft(parts[0]), quantity }).quantity,
        ),
      ).toBe(true);
  });
  it("erhält Einzelpositionen und Gesamtsummen nach JSON-Persistenz und erneutem Laden", () => {
    const saved = normalizeOrder(order());
    const restored = normalizeOrder(
      JSON.parse(JSON.stringify(saved)) as OrderInput,
    );
    expect(restored).toEqual(saved);
  });
  it("exportiert sämtliche Positionen und neu berechnete Summen in JSON, CSV und SQL", () => {
    const data = createDemoData();
    data.orders = [normalizeOrder(order())];
    const j = JSON.parse(jsonExport(data));
    expect(j.schemaVersion).toBe(3);
    expect(j.orders[0].parts).toEqual(parts);
    expect(j.orders[0].costCents).toBe(2 * 6900 + 3 * 29 + 700);
    const csv = csvExport(data);
    expect(csv).toContain("Ersatzteile_JSON");
    expect(csv).toContain("Teile_Einkauf_EUR");
    expect(csv).toContain("Arbeitslohn_Leistungen_EUR");
    expect(csv).toContain("Bremsscheibe");
    const sql = sqlExport(data);
    expect(sql).toContain("parts JSON NOT NULL");
    expect(sql).toContain("other_cost_cents");
    expect(sql).toContain("service_price_cents");
    expect(sql).toContain(JSON.stringify(parts));
    expect(sql).not.toContain("DROP TABLE");
  });
});
