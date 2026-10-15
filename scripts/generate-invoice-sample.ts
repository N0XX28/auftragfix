import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildInvoicePdf } from "../lib/invoice-pdf";
import { createInvoiceModel } from "../shared/invoice";
import { normalizeOrder } from "../shared/workshop";
import { invoiceFixture } from "../tests/invoice-fixture";

async function main() {
  const fonts = {
    regular: new Uint8Array(readFileSync("assets/fonts/DejaVuSans.ttf")),
    bold: new Uint8Array(readFileSync("assets/fonts/DejaVuSans-Bold.ttf")),
  };
  const f = invoiceFixture();
  mkdirSync("examples", { recursive: true });
  const sample = resolve("examples/muster-rechnung.pdf");
  writeFileSync(sample, await buildInvoicePdf(f.model, fonts));
  console.log(sample);
  const order = normalizeOrder({
    ...f.order,
    parts: Array.from({ length: 100 }, (_, i) => ({
      id: `teil-${i}`,
      description: `Muster-Ersatzteil ${i + 1} mit längerer Beschreibung für einen nachvollziehbaren mehrseitigen Umbruch`,
      quantity: 2,
      purchaseCents: 10,
      saleCents: 29,
    })),
    services:
      Array.from(
        { length: 60 },
        (_, i) =>
          `Leistung ${i + 1}: Prüfarbeit am fiktiven Fahrzeug durchgeführt.`,
      ).join("\n") + "\nENDE-DER-LEISTUNGEN",
    servicePriceCents: 123,
    otherCostCents: 0,
  });
  const long = createInvoiceModel(
    order,
    f.customer,
    f.vehicle,
    f.profile,
    { ...f.options, number: "W".repeat(60) },
    true,
  );
  writeFileSync(
    "/tmp/auftragfix-invoice-long.pdf",
    await buildInvoicePdf(long, fonts),
  );
  console.log("/tmp/auftragfix-invoice-long.pdf");
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
