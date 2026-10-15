import { describe, expect, it } from "vitest";
import { createDemoData } from "../lib/demo-data";
import {
  csvExport,
  customerSchema,
  isCalendarDate,
  isOverdue,
  jsonExport,
  money,
  orderSchema,
  parseDateInput,
  parseMoney,
  sqlExport,
  sqlString,
  validateRelations,
  vehicleSchema,
} from "../shared/workshop";
import { appRouter } from "../server/routers";

describe("Geld und Datum", () => {
  it("verarbeitet deutsche Beträge exakt in Cent", () => {
    expect(parseMoney("1.234,56")).toBe(123456);
    expect(parseMoney("0,29")).toBe(29);
    expect(parseMoney("123.45")).toBe(12345);
    expect(parseMoney("")).toBe(0);
    expect(Number.isNaN(parseMoney("-3,00"))).toBe(true);
    expect(Number.isNaN(parseMoney("12,345"))).toBe(true);
    expect(money(29)).toContain("0,29");
  });
  it("validiert Kalenderdaten und das deutsche Eingabeformat", () => {
    expect(parseDateInput("15.10.2026")).toBe("2026-10-15");
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("2024-02-29")).toBe(true);
    expect(isCalendarDate("2026-2-3")).toBe(false);
  });
});
describe("Stammdaten und Aufträge", () => {
  it("erhält Kunden-/Fahrzeugbeziehungen", () => {
    const d = createDemoData();
    for (const o of d.orders) {
      expect(orderSchema.safeParse(o).success).toBe(true);
      expect(validateRelations(d, o)).toBe(true);
    }
    for (const c of d.customers)
      expect(customerSchema.safeParse(c).success).toBe(true);
    for (const v of d.vehicles)
      expect(vehicleSchema.safeParse(v).success).toBe(true);
    expect(
      validateRelations(d, { ...d.orders[0], customerId: d.customers[1].id }),
    ).toBe(false);
  });
  it("verhindert unlogische Termine und negative Kosten", () => {
    const o = createDemoData().orders[0];
    expect(
      orderSchema.safeParse({
        ...o,
        receivedDate: "2026-10-20",
        deadline: "2026-10-15",
      }).success,
    ).toBe(false);
    expect(
      orderSchema.safeParse({ ...o, status: "done", completedDate: "" })
        .success,
    ).toBe(false);
    expect(orderSchema.safeParse({ ...o, costCents: -1 }).success).toBe(false);
  });
  it("markiert nur offene Aufträge als überfällig", () => {
    const o = createDemoData().orders[0];
    expect(isOverdue({ ...o, deadline: "2026-10-14" }, "2026-10-15")).toBe(
      true,
    );
    expect(isOverdue({ ...o, deadline: "2026-10-15" }, "2026-10-15")).toBe(
      false,
    );
    expect(
      isOverdue({ ...o, status: "done", deadline: "2026-10-14" }, "2026-10-15"),
    ).toBe(false);
  });
});
describe("Vollständige Exporte", () => {
  it("JSON exportiert alle Stammdaten, Beziehungen und Cent-Werte", () => {
    const d = createDemoData();
    const out = JSON.parse(jsonExport(d));
    expect(out.customers).toEqual(d.customers);
    expect(out.vehicles).toEqual(d.vehicles);
    expect(out.orders).toEqual(d.orders);
    expect(out.moneyUnit).toBe("cents");
  });
  it("CSV verknüpft Aufträge und schützt vor Formel-Injection", () => {
    const d = createDemoData();
    d.customers[0].name = '=HYPERLINK("evil")';
    const out = csvExport(d);
    expect(out.startsWith("\uFEFF")).toBe(true);
    expect(out).toContain("Telefon");
    expect(out).toContain("Eigene_Kosten_EUR");
    expect(out).toContain("248,00");
    expect(out).toContain("'=HYPERLINK");
    expect(out).toContain(d.vehicles[0].plate);
  });
  it("SQL enthält relationales Schema ohne destruktives DROP", () => {
    const d = createDemoData();
    d.customers[0].name = "O'Connor\\Test\nZeile";
    const out = sqlExport(d);
    expect(out).toContain("FOREIGN KEY (customer_id) REFERENCES customers(id)");
    expect(out).toContain("O''Connor\\\\Test\\nZeile");
    expect(out.match(/INSERT INTO customers /g)?.length).toBe(
      d.customers.length,
    );
    expect(out.match(/INSERT INTO vehicles /g)?.length).toBe(d.vehicles.length);
    expect(out.match(/INSERT INTO orders /g)?.length).toBe(d.orders.length);
    expect(out).not.toContain("DROP TABLE");
    expect(out).toContain("START TRANSACTION;");
    expect(out).toContain("COMMIT;");
    expect(sqlString("a'b")).toBe("'a''b'");
  });
});
describe("Private SQL-API", () => {
  it("verweigert nicht angemeldeten Nutzern den Zugriff", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as never,
      res: {} as never,
    });
    await expect(caller.workshop.snapshot()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      caller.workshop.saveCustomer(createDemoData().customers[0]),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.workshop.deleteOrder({ id: "demo-o1" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
