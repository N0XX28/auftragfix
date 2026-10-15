import { moneyInput, parseMoney, type Part } from "./workshop";

export type PartDraft = {
  id: string;
  description: string;
  quantity: string;
  purchase: string;
  sale: string;
};

export function partToDraft(part: Part): PartDraft {
  return {
    id: part.id,
    description: part.description,
    quantity: String(part.quantity),
    purchase: moneyInput(part.purchaseCents),
    sale: moneyInput(part.saleCents),
  };
}

export function draftToPart(draft: PartDraft): Part {
  const quantity = /^\d+$/.test(draft.quantity.trim())
    ? Number(draft.quantity.trim())
    : NaN;
  return {
    id: draft.id,
    description: draft.description,
    quantity,
    purchaseCents: parseMoney(draft.purchase),
    saleCents: parseMoney(draft.sale),
  };
}
