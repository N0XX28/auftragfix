import { Pressable, Text, View } from "react-native";
import { draftToPart, type PartDraft } from "../../shared/parts-form";
import { money, newId } from "../../shared/workshop";
import { Button, C, Copy, Field, FormRow, Icon, Label } from "./ui";

export function PartsEditor({
  value,
  onChange,
  errors,
}: {
  value: PartDraft[];
  onChange: (parts: PartDraft[]) => void;
  errors: Record<string, string>;
}) {
  function update(index: number, field: keyof PartDraft, next: string) {
    onChange(value.map((p, i) => (i === index ? { ...p, [field]: next } : p)));
  }
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
        <Icon name="package" color={C.orange} size={18} />
        <Text style={{ color: C.ink, fontSize: 16, fontWeight: "600" }}>
          Ersatzteile
        </Text>
        <Text style={{ color: C.muted, fontSize: 12 }}>({value.length})</Text>
      </View>
      <Copy>
        Einkauf und Verkauf pro Stück eintragen. Die Menge wird automatisch
        berücksichtigt.
      </Copy>
      {value.map((draft, index) => {
        const part = draftToPart(draft);
        const valid =
          Number.isInteger(part.quantity) &&
          part.quantity > 0 &&
          part.quantity <= 9999;
        return (
          <View
            key={draft.id}
            style={{
              padding: 14,
              gap: 12,
              backgroundColor: C.bg,
              borderColor: C.line,
              borderWidth: 1,
              borderRadius: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Label>Position {index + 1}</Label>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ersatzteilposition ${index + 1} entfernen`}
                onPress={() => onChange(value.filter((_, i) => i !== index))}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="trash-2" color={C.red} size={17} />
              </Pressable>
            </View>
            <Field
              label="Ersatzteil *"
              value={draft.description}
              placeholder="z. B. Bremsscheibe vorne"
              onChangeText={(v) => update(index, "description", v)}
              error={errors[`parts.${index}.description`]}
            />
            <Field
              label="Menge *"
              value={draft.quantity}
              onChangeText={(v) => update(index, "quantity", v)}
              placeholder="1"
              keyboardType="number-pad"
              error={errors[`parts.${index}.quantity`]}
            />
            <FormRow>
              <Field
                label="Einkauf pro Stück (EUR)"
                value={draft.purchase}
                onChangeText={(v) => update(index, "purchase", v)}
                placeholder="0,00"
                keyboardType="decimal-pad"
                error={errors[`parts.${index}.purchaseCents`]}
              />
              <Field
                label="Verkauf pro Stück (EUR)"
                value={draft.sale}
                onChangeText={(v) => update(index, "sale", v)}
                placeholder="0,00"
                keyboardType="decimal-pad"
                error={errors[`parts.${index}.saleCents`]}
              />
            </FormRow>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Text style={{ color: C.muted, fontSize: 12 }}>
                Einkauf gesamt:{" "}
                {valid && Number.isFinite(part.purchaseCents)
                  ? money(part.quantity * part.purchaseCents)
                  : "–"}
              </Text>
              <Text
                style={{ color: C.orange, fontSize: 12, fontWeight: "600" }}
              >
                Verkauf gesamt:{" "}
                {valid && Number.isFinite(part.saleCents)
                  ? money(part.quantity * part.saleCents)
                  : "–"}
              </Text>
            </View>
          </View>
        );
      })}
      {!!errors.parts && (
        <Text style={{ color: C.red, fontSize: 12 }}>{errors.parts}</Text>
      )}
      <Button
        label="Ersatzteil hinzufügen"
        icon="plus"
        variant="secondary"
        disabled={value.length >= 100}
        onPress={() =>
          onChange([
            ...value,
            {
              id: newId(),
              description: "",
              quantity: "1",
              purchase: "",
              sale: "",
            },
          ])
        }
      />
      {!value.length && (
        <Copy>
          Noch keine Ersatzteile. Ein Auftrag kann auch ausschließlich
          Leistungen enthalten.
        </Copy>
      )}
    </View>
  );
}
