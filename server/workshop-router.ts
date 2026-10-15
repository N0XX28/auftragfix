import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  workshopCustomers,
  workshopOrders,
  workshopVehicles,
} from "../drizzle/schema";
import {
  customerSchema,
  normalizeOrder,
  orderSchema,
  vehicleSchema,
  type WorkshopData,
} from "../shared/workshop";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

async function database() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Datenbank ist momentan nicht erreichbar. Bitte erneut versuchen.",
    });
  return db;
}
const notFound = () =>
  new TRPCError({
    code: "NOT_FOUND",
    message: "Datensatz nicht gefunden oder kein Zugriff.",
  });
export const workshopRouter = router({
  snapshot: protectedProcedure.query(async ({ ctx }): Promise<WorkshopData> => {
    const db = await database();
    const [customers, vehicles, orders] = await Promise.all([
      db
        .select()
        .from(workshopCustomers)
        .where(eq(workshopCustomers.ownerId, ctx.user.id)),
      db
        .select()
        .from(workshopVehicles)
        .where(eq(workshopVehicles.ownerId, ctx.user.id)),
      db
        .select()
        .from(workshopOrders)
        .where(eq(workshopOrders.ownerId, ctx.user.id)),
    ]);
    const withoutOwner = <T extends { ownerId: number }>(
      r: T,
    ): Omit<T, "ownerId"> => {
      const { ownerId: _owner, ...rest } = r;
      return rest;
    };
    return {
      customers: customers.map((c) =>
        customerSchema.parse({ ...withoutOwner(c), address: c.address ?? "" }),
      ),
      vehicles: vehicles.map(withoutOwner),
      orders: orders.map((r) =>
        normalizeOrder({
          ...withoutOwner(r),
          parts: r.parts ?? [],
          otherCostCents: r.otherCostCents ?? undefined,
          servicePriceCents: r.servicePriceCents ?? undefined,
        }),
      ),
    };
  }),
  saveCustomer: protectedProcedure
    .input(customerSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await database();
      const [existing] = await db
        .select()
        .from(workshopCustomers)
        .where(eq(workshopCustomers.id, input.id));
      if (existing && existing.ownerId !== ctx.user.id) throw notFound();
      if (existing)
        await db
          .update(workshopCustomers)
          .set(input)
          .where(
            and(
              eq(workshopCustomers.id, input.id),
              eq(workshopCustomers.ownerId, ctx.user.id),
            ),
          );
      else
        await db
          .insert(workshopCustomers)
          .values({ ...input, ownerId: ctx.user.id });
      return { success: true };
    }),
  saveVehicle: protectedProcedure
    .input(vehicleSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await database();
      const [customer] = await db
        .select()
        .from(workshopCustomers)
        .where(
          and(
            eq(workshopCustomers.id, input.customerId),
            eq(workshopCustomers.ownerId, ctx.user.id),
          ),
        );
      if (!customer) throw notFound();
      const [existing] = await db
        .select()
        .from(workshopVehicles)
        .where(eq(workshopVehicles.id, input.id));
      if (
        existing &&
        (existing.ownerId !== ctx.user.id ||
          existing.customerId !== input.customerId)
      )
        throw notFound();
      if (existing)
        await db
          .update(workshopVehicles)
          .set(input)
          .where(
            and(
              eq(workshopVehicles.id, input.id),
              eq(workshopVehicles.ownerId, ctx.user.id),
            ),
          );
      else
        await db
          .insert(workshopVehicles)
          .values({ ...input, ownerId: ctx.user.id });
      return { success: true };
    }),
  saveOrder: protectedProcedure
    .input(orderSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await database();
      const [vehicle] = await db
        .select()
        .from(workshopVehicles)
        .where(
          and(
            eq(workshopVehicles.id, input.vehicleId),
            eq(workshopVehicles.customerId, input.customerId),
            eq(workshopVehicles.ownerId, ctx.user.id),
          ),
        );
      const [customer] = await db
        .select()
        .from(workshopCustomers)
        .where(
          and(
            eq(workshopCustomers.id, input.customerId),
            eq(workshopCustomers.ownerId, ctx.user.id),
          ),
        );
      if (!vehicle || !customer)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Kunde und Fahrzeug müssen zusammengehören und in Ihrer Kartei vorhanden sein.",
        });
      const [existing] = await db
        .select()
        .from(workshopOrders)
        .where(eq(workshopOrders.id, input.id));
      if (existing && existing.ownerId !== ctx.user.id) throw notFound();
      if (existing)
        await db
          .update(workshopOrders)
          .set(input)
          .where(
            and(
              eq(workshopOrders.id, input.id),
              eq(workshopOrders.ownerId, ctx.user.id),
            ),
          );
      else
        await db
          .insert(workshopOrders)
          .values({ ...input, ownerId: ctx.user.id });
      return { success: true };
    }),
  deleteOrder: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const db = await database();
      const [existing] = await db
        .select()
        .from(workshopOrders)
        .where(
          and(
            eq(workshopOrders.id, input.id),
            eq(workshopOrders.ownerId, ctx.user.id),
          ),
        );
      if (!existing) throw notFound();
      await db
        .delete(workshopOrders)
        .where(
          and(
            eq(workshopOrders.id, input.id),
            eq(workshopOrders.ownerId, ctx.user.id),
          ),
        );
      return { success: true };
    }),
});
