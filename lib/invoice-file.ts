import { loadInvoiceFontAssets } from "./invoice-assets";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { invoiceFilename, type InvoiceModel } from "../shared/invoice";

export async function exportInvoicePdf(model: InvoiceModel): Promise<void> {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Dateifreigabe ist auf diesem Gerät nicht verfügbar.");
  const { buildInvoicePdf } = await import("./invoice-pdf");
  const [regular, bold] = await loadInvoiceFontAssets();
  if (!regular.localUri || !bold.localUri)
    throw new Error("PDF-Schriften konnten nicht lokal bereitgestellt werden.");
  const [regularBytes, boldBytes] = await Promise.all([
    new File(regular.localUri).bytes(),
    new File(bold.localUri).bytes(),
  ]);
  const pdf = await buildInvoicePdf(model, {
    regular: regularBytes,
    bold: boldBytes,
  });
  const file = new File(Paths.cache, invoiceFilename(model.options.number));
  file.create({ overwrite: true });
  file.write(pdf);
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: "Kundenrechnung als PDF teilen",
  });
}
