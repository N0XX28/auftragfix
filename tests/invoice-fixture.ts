import { createDemoData } from "../lib/demo-data";
import {
  createInvoiceModel,
  type InvoiceOptions,
  type WorkshopProfile,
} from "../shared/invoice";
import { localToday, normalizeOrder } from "../shared/workshop";

export function invoiceFixture() {
  const data = createDemoData();
  const today = localToday();
  const order = normalizeOrder({
    ...data.orders[0],
    status: "done",
    completedDate: today,
    services:
      "Bremsscheiben und Bremsbeläge vorne erneuert\nInspektion durchgeführt\nBremsflüssigkeit geprüft",
  });
  const customer = {
    ...data.customers[0],
    name: "Max Mustermann",
    phone: "0000 000000",
    email: "kunde@example.com",
    address: "Musterweg 3\n12345 Musterstadt",
  };
  const vehicle = { ...data.vehicles[0], vin: "MUSTER-FIN-123" };
  const profile: WorkshopProfile = {
    name: "Musterwerkstatt Beispiel",
    address: "Beispielstraße 12\n12345 Musterstadt",
    contact: "werkstatt@example.com · Telefon 0000 000000",
    taxIdentifier: "MUSTER – keine gültige Steuerkennung",
    iban: "",
    bic: "",
  };
  const options: InvoiceOptions = {
    number: "MUSTER-2026-001",
    invoiceDate: today,
    serviceDate: today,
    recipientAddress: customer.address,
    dueDate: "",
    taxMode: "gross",
    rateBasisPoints: 1900,
    taxNote: "Nur ein fiktives Anwendungsbeispiel. Keine echte Rechnung.",
    paymentNote: "Musterrechnung – keine Zahlungsaufforderung.",
  };
  const model = createInvoiceModel(
    order,
    customer,
    vehicle,
    profile,
    options,
    true,
  );
  return { data, order, customer, vehicle, profile, options, model };
}
