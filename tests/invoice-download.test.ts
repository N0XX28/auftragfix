import { afterEach, describe, expect, it, vi } from "vitest";
import { invoiceFixture } from "./invoice-fixture";
const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  build: vi.fn(),
  evaluated: vi.fn(),
}));
vi.mock("../lib/invoice-assets", () => ({ loadInvoiceFontAssets: mocks.load }));
vi.mock("../lib/invoice-pdf", () => {
  mocks.evaluated();
  return { buildInvoicePdf: mocks.build };
});
import { exportInvoicePdf } from "../lib/invoice-file.web";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.clearAllMocks();
});
describe("PDF-Dateidownload im Web", () => {
  it("wertet die PDF-Bibliothek beim Laden der App noch nicht aus", () => {
    expect(typeof exportInvoicePdf).toBe("function");
    expect(mocks.evaluated).not.toHaveBeenCalled();
    expect(mocks.build).not.toHaveBeenCalled();
  });
  it("stellt eine echte Binär-PDF mit Dateinamen und Downloadaktion bereit", async () => {
    vi.useFakeTimers();
    const pdf = new TextEncoder().encode("%PDF-test");
    mocks.build.mockResolvedValue(pdf);
    mocks.load.mockResolvedValue([
      { uri: "/font-regular.ttf" },
      { uri: "/font-bold.ttf" },
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(1),
      }),
    );
    const link = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
    const appendChild = vi.fn();
    vi.stubGlobal("document", {
      createElement: vi.fn(() => link),
      body: { appendChild },
    });
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:invoice-test");
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    await exportInvoicePdf(invoiceFixture().model);
    expect(link.download).toBe("Rechnung-MUSTER-2026-001.pdf");
    expect(link.click).toHaveBeenCalledOnce();
    expect(link.remove).toHaveBeenCalledOnce();
    expect(appendChild).toHaveBeenCalledWith(link);
    const blob = create.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/pdf");
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(pdf);
    await vi.runAllTimersAsync();
    expect(revoke).toHaveBeenCalledWith("blob:invoice-test");
  });
  it("gibt Rendererfehler als abfangbare Promise an das Rechnungsformular zurück", async () => {
    mocks.build.mockRejectedValueOnce(
      new Error("PDF-Renderer nicht verfügbar"),
    );
    mocks.load.mockResolvedValue([{ uri: "/font.ttf" }, { uri: "/font.ttf" }]);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(1),
        }),
    );
    const create = vi.spyOn(URL, "createObjectURL");
    await expect(exportInvoicePdf(invoiceFixture().model)).rejects.toThrow(
      "PDF-Renderer nicht verfügbar",
    );
    expect(create).not.toHaveBeenCalled();
  });
  it("meldet Schrift-Downloadfehler statt einen erfolgreichen PDF-Download vorzutäuschen", async () => {
    mocks.load.mockResolvedValue([{ uri: "/font.ttf" }, { uri: "/font.ttf" }]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(exportInvoicePdf(invoiceFixture().model)).rejects.toThrow(
      "PDF-Schrift konnte nicht geladen",
    );
  });
});
