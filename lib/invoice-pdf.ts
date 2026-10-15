import {
  PDFDocument,
  PageSizes,
  rgb,
  degrees,
  type PDFFont,
  type PDFPage,
} from "pdf-lib/cjs/index.js";
// Metro lädt sonst den ESM-tslib-Bridge mit einem undefinierten Default-Export.
// Der offizielle CommonJS-Einstieg verwendet die Helper direkt und ist kompatibel.
import fontkit from "@pdf-lib/fontkit";
import { dateInput, money } from "../shared/workshop";
import type { InvoiceModel } from "../shared/invoice";

export type InvoiceFonts = { regular: Uint8Array; bold: Uint8Array };
const ink = rgb(0.12, 0.16, 0.15),
  muted = rgb(0.43, 0.48, 0.46),
  orange = rgb(0.95, 0.4, 0.18),
  light = rgb(0.95, 0.96, 0.95);
const margin = 48,
  lineHeight = 14,
  bottom = 64;

function wrap(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
): string[] {
  const result: string[] = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    if (!paragraph) {
      result.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) {
        result.push(line);
        line = "";
      }
      if (font.widthOfTextAtSize(word, size) <= width) {
        line = word;
        continue;
      }
      for (const char of word) {
        if (line && font.widthOfTextAtSize(line + char, size) > width) {
          result.push(line);
          line = "";
        }
        line += char;
      }
    }
    if (line) result.push(line);
  }
  return result;
}

export async function buildInvoicePdf(
  model: InvoiceModel,
  fonts: InvoiceFonts,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(fonts.regular, { subset: true });
  const bold = await doc.embedFont(fonts.bold, { subset: true });
  const supported = new Set(regular.getCharacterSet());
  for (const char of JSON.stringify(model)) {
    if (!/[\r\n\t]/.test(char) && !supported.has(char.codePointAt(0)!))
      throw new Error(
        `Die Schrift unterstützt das Zeichen „${char}“ nicht. Bitte die Rechnungsangaben prüfen.`,
      );
  }
  doc.setTitle(`Rechnung ${model.options.number}`);
  doc.setAuthor(model.workshop.name);
  doc.setCreator("AuftragFix");
  const [pageWidth, pageHeight] = PageSizes.A4;
  const contentWidth = pageWidth - 2 * margin;
  let page!: PDFPage;
  let y = 0;
  const text = (
    value: string,
    x: number,
    baseline: number,
    size = 10,
    font = regular,
    color = ink,
  ) => page.drawText(value, { x, y: baseline, size, font, color });
  const right = (
    value: string,
    end: number,
    baseline: number,
    size = 10,
    font = regular,
    color = ink,
  ) =>
    text(
      value,
      end - font.widthOfTextAtSize(value, size),
      baseline,
      size,
      font,
      color,
    );
  function newPage(first = false) {
    page = doc.addPage(PageSizes.A4);
    if (model.isDemo)
      page.drawText("MUSTER", {
        x: 155,
        y: 350,
        size: 66,
        font: bold,
        color: muted,
        opacity: 0.09,
        rotate: degrees(35),
      });
    text(
      "AUFTRAGFIX / KUNDENRECHNUNG",
      margin,
      pageHeight - 43,
      8,
      regular,
      muted,
    );
    right(
      model.isDemo ? "MUSTER · KEINE ECHTE RECHNUNG" : "EUR",
      pageWidth - margin,
      pageHeight - 43,
      8,
      bold,
      model.isDemo ? orange : muted,
    );
    page.drawRectangle({
      x: margin,
      y: pageHeight - 55,
      width: contentWidth,
      height: 2,
      color: orange,
    });
    if (first) {
      text("Rechnung", margin, pageHeight - 98, 28, bold);
      const numberLines = wrap(
        model.options.number,
        bold,
        11,
        contentWidth / 2 - 10,
      );
      numberLines.forEach((line, i) =>
        right(line, pageWidth - margin, pageHeight - 86 - i * 15, 11, bold),
      );
      y = Math.min(
        pageHeight - 120,
        pageHeight - 86 - numberLines.length * 15 - 15,
      );
    } else {
      const numberLines = wrap(
        `Rechnung ${model.options.number}`,
        bold,
        12,
        contentWidth,
      );
      numberLines.forEach((line, i) =>
        text(line, margin, pageHeight - 86 - i * 15, 12, bold),
      );
      y = pageHeight - 112 - (numberLines.length - 1) * 15;
    }
  }
  function ensure(height: number, table = false) {
    if (y - height < bottom) {
      newPage();
      if (table) tableHeader();
    }
  }
  function paragraph(
    value: string,
    size = 10,
    font = regular,
    color = ink,
    width = contentWidth,
    x = margin,
  ) {
    const lines = wrap(value, font, size, width);
    for (const line of lines) {
      ensure(lineHeight);
      if (line) text(line, x, y, size, font, color);
      y -= lineHeight;
    }
  }
  function heading(value: string) {
    ensure(44);
    y -= 10;
    text(value, margin, y, 11, bold);
    y -= 22;
  }
  const columns = [28, contentWidth - 28 - 45 - 90 - 90, 45, 90, 90];
  const offsets = columns.map(
    (_, i) => margin + columns.slice(0, i).reduce((sum, n) => sum + n, 0),
  );
  function tableHeader() {
    ensure(32);
    page.drawRectangle({
      x: margin,
      y: y - 24,
      width: contentWidth,
      height: 26,
      color: light,
    });
    text("Pos.", offsets[0] + 5, y - 15, 9, bold);
    text("Bezeichnung", offsets[1] + 5, y - 15, 9, bold);
    right("Menge", offsets[2] + columns[2] - 5, y - 15, 9, bold);
    right("Einzelpreis", offsets[3] + columns[3] - 5, y - 15, 9, bold);
    right("Betrag", pageWidth - margin - 5, y - 15, 9, bold);
    y -= 30;
  }
  newPage(true);
  const leftLines = [
    model.workshop.name,
    ...model.workshop.address.split("\n"),
    model.workshop.contact,
    model.workshop.taxIdentifier
      ? `Steuerkennung: ${model.workshop.taxIdentifier}`
      : "",
  ]
    .filter(Boolean)
    .flatMap((s) => wrap(s, regular, 10, contentWidth / 2 - 18));
  const rightLines = [
    model.recipient.name,
    ...model.recipient.address.split("\n"),
    model.recipient.phone,
    model.recipient.email,
  ]
    .filter(Boolean)
    .flatMap((s) => wrap(s, regular, 10, contentWidth / 2 - 18));
  text("RECHNUNGSSTELLER", margin, y, 8, bold, muted);
  text("RECHNUNGSEMPFÄNGER", margin + contentWidth / 2 + 12, y, 8, bold, muted);
  y -= 20;
  for (let i = 0; i < Math.max(leftLines.length, rightLines.length); i++) {
    if (y - lineHeight < bottom) {
      newPage();
      text("RECHNUNGSSTELLER", margin, y, 8, bold, muted);
      text(
        "RECHNUNGSEMPFÄNGER",
        margin + contentWidth / 2 + 12,
        y,
        8,
        bold,
        muted,
      );
      y -= 20;
    }
    if (leftLines[i]) text(leftLines[i], margin, y);
    if (rightLines[i]) text(rightLines[i], margin + contentWidth / 2 + 12, y);
    y -= lineHeight;
  }
  y -= 16;
  ensure(62);
  const metadata = [
    ["RECHNUNGSDATUM", dateInput(model.options.invoiceDate)],
    ["LEISTUNGSDATUM", dateInput(model.options.serviceDate)],
    [
      "ZAHLUNGSFRIST",
      model.options.dueDate
        ? dateInput(model.options.dueDate)
        : "Nicht angegeben",
    ],
  ];
  metadata.forEach(([label, value], i) => {
    const x = margin + i * (contentWidth / 3);
    text(label, x, y, 8, bold, muted);
    text(value, x, y - 18, 10);
  });
  y -= 41;
  paragraph(`Auftrag ${model.orderNumber} · ${model.orderTitle}`, 10, bold);
  paragraph(
    `${model.vehicle.make} ${model.vehicle.model} · Kennzeichen ${model.vehicle.plate} · ${model.vehicle.mileage.toLocaleString("de-DE")} km`,
    10,
    regular,
    muted,
  );
  if (model.vehicle.vin)
    paragraph(`FIN: ${model.vehicle.vin}`, 9, regular, muted);
  y -= 10;
  const basis =
    model.options.taxMode === "net"
      ? "Alle Positionspreise netto."
      : model.options.taxMode === "gross"
        ? "Alle Positionspreise brutto, inklusive der unten ausgewiesenen Umsatzsteuer."
        : "Positionspreise ohne gesonderten Umsatzsteuerausweis.";
  paragraph(basis, 9, regular, muted);
  y -= 6;
  tableHeader();
  model.lines.forEach((line, index) => {
    const description = wrap(line.description, regular, 10, columns[1] - 12);
    const height = Math.max(1, description.length) * lineHeight + 14;
    ensure(height, true);
    text(String(index + 1), offsets[0] + 5, y - 12, 9, regular, muted);
    description.forEach((s, i) =>
      text(s, offsets[1] + 5, y - 12 - i * lineHeight, 10),
    );
    right(String(line.quantity), offsets[2] + columns[2] - 5, y - 12);
    right(money(line.unitPriceCents), offsets[3] + columns[3] - 5, y - 12);
    right(money(line.totalCents), pageWidth - margin - 5, y - 12, 10, bold);
    y -= height;
    page.drawLine({
      start: { x: margin, y: y + 3 },
      end: { x: pageWidth - margin, y: y + 3 },
      thickness: 0.5,
      color: light,
    });
  });
  y -= 14;
  ensure(118);
  const rate = (model.options.rateBasisPoints / 100).toLocaleString("de-DE", {
    maximumFractionDigits: 2,
  });
  const sumRow = (label: string, value: number, strong = false) => {
    text(
      label,
      margin + contentWidth / 2 - 12,
      y,
      strong ? 11 : 10,
      strong ? bold : regular,
      strong ? ink : muted,
    );
    right(
      money(value),
      pageWidth - margin,
      y,
      strong ? 15 : 11,
      strong ? bold : regular,
      strong ? orange : ink,
    );
    y -= 25;
  };
  if (model.options.taxMode !== "none") {
    sumRow("Nettobetrag", model.totals.netCents);
    sumRow(`Umsatzsteuer ${rate} %`, model.totals.taxCents);
  } else sumRow("Summe", model.totals.netCents);
  page.drawLine({
    start: { x: margin + contentWidth / 2 - 12, y: y + 11 },
    end: { x: pageWidth - margin, y: y + 11 },
    thickness: 1,
    color: orange,
  });
  y -= 8;
  sumRow("Gesamtbetrag", model.totals.totalCents, true);
  y -= 8;
  if (model.services.length) {
    heading("Ausgeführte Leistungen");
    model.services.forEach((s) => {
      paragraph(`• ${s}`);
      y -= 4;
    });
  }
  if (model.options.taxNote) {
    heading("Steuerhinweis");
    paragraph(model.options.taxNote, 9, regular, muted);
  }
  if (
    model.options.paymentNote ||
    model.workshop.iban ||
    model.workshop.bic ||
    model.options.dueDate
  ) {
    heading("Zahlung");
    if (model.options.dueDate)
      paragraph(
        `Bitte bis zum ${dateInput(model.options.dueDate)} unter Angabe der Rechnungsnummer bezahlen.`,
      );
    if (model.workshop.iban) paragraph(`IBAN: ${model.workshop.iban}`);
    if (model.workshop.bic) paragraph(`BIC: ${model.workshop.bic}`);
    if (model.options.paymentNote) paragraph(model.options.paymentNote);
  }
  const pages = doc.getPages();
  pages.forEach((p, index) => {
    p.drawLine({
      start: { x: margin, y: 43 },
      end: { x: pageWidth - margin, y: 43 },
      thickness: 0.5,
      color: light,
    });
    p.drawText(
      model.isDemo
        ? "Musterrechnung aus fiktiven Demodaten. Nicht als echte Rechnung verwenden."
        : "Mit AuftragFix erstellt.",
      { x: margin, y: 28, size: 7.5, font: regular, color: muted },
    );
    const label = `Seite ${index + 1} / ${pages.length}`;
    p.drawText(label, {
      x: pageWidth - margin - regular.widthOfTextAtSize(label, 8),
      y: 28,
      size: 8,
      font: regular,
      color: muted,
    });
  });
  return doc.save();
}
