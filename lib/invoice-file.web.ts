import type { Asset } from "expo-asset";
import { loadInvoiceFontAssets } from "./invoice-assets";
import { invoiceFilename, type InvoiceModel } from "../shared/invoice";

export async function exportInvoicePdf(model: InvoiceModel): Promise<void> {
  const { buildInvoicePdf } = await import("./invoice-pdf");
  const [regular, bold] = await loadInvoiceFontAssets();
  async function bytes(asset: Asset): Promise<Uint8Array> {
    const response = await fetch(asset.localUri ?? asset.uri);
    if (!response.ok)
      throw new Error("PDF-Schrift konnte nicht geladen werden.");
    return new Uint8Array(await response.arrayBuffer());
  }
  const [regularBytes, boldBytes] = await Promise.all([
    bytes(regular),
    bytes(bold),
  ]);
  const pdf = await buildInvoicePdf(model, {
    regular: regularBytes,
    bold: boldBytes,
  });
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(pdf).buffer], { type: "application/pdf" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = invoiceFilename(model.options.number);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
