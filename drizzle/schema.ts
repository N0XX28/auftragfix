import {
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import type { Order } from "../shared/workshop";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const workshopCustomers = mysqlTable(
  "workshop_customers",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    ownerId: int("owner_id")
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    address: text("address"),
    notes: text("notes").notNull(),
  },
  (t) => [index("customer_owner_idx").on(t.ownerId)],
);
export const workshopVehicles = mysqlTable(
  "workshop_vehicles",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    ownerId: int("owner_id")
      .notNull()
      .references(() => users.id),
    customerId: varchar("customer_id", { length: 64 })
      .notNull()
      .references(() => workshopCustomers.id),
    plate: varchar("plate", { length: 24 }).notNull(),
    make: varchar("make", { length: 80 }).notNull(),
    model: varchar("model", { length: 120 }).notNull(),
    year: varchar("year", { length: 4 }).notNull(),
    vin: varchar("vin", { length: 40 }).notNull(),
    mileage: int("mileage").notNull(),
    fuel: varchar("fuel", { length: 40 }).notNull(),
  },
  (t) => [
    index("vehicle_owner_idx").on(t.ownerId),
    index("vehicle_customer_idx").on(t.customerId),
  ],
);
export const workshopOrders = mysqlTable(
  "workshop_orders",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    ownerId: int("owner_id")
      .notNull()
      .references(() => users.id),
    customerId: varchar("customer_id", { length: 64 })
      .notNull()
      .references(() => workshopCustomers.id),
    vehicleId: varchar("vehicle_id", { length: 64 })
      .notNull()
      .references(() => workshopVehicles.id),
    number: varchar("number", { length: 40 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    receivedDate: varchar("received_date", { length: 10 }).notNull(),
    deadline: varchar("deadline", { length: 10 }).notNull(),
    completedDate: varchar("completed_date", { length: 10 }).notNull(),
    status: mysqlEnum("status", ["new", "working", "done"]).notNull(),
    damages: text("damages").notNull(),
    services: text("services").notNull(),
    measurements: json("measurements").$type<Order["measurements"]>().notNull(),
    parts: json("parts").$type<Order["parts"]>(),
    otherCostCents: int("other_cost_cents"),
    servicePriceCents: int("service_price_cents"),
    costCents: int("cost_cents").notNull(),
    priceCents: int("price_cents").notNull(),
  },
  (t) => [
    index("order_owner_idx").on(t.ownerId),
    index("order_vehicle_idx").on(t.vehicleId),
  ],
);
