import { Feather } from "@expo/vector-icons";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import type { ComponentProps, ReactNode } from "react";
import {
  initials,
  statusLabels,
  type OrderStatus,
} from "../../shared/workshop";

export const C = {
  bg: "#F6F7F5",
  paper: "#FFFFFF",
  ink: "#202726",
  muted: "#7C8582",
  line: "#E5E9E5",
  orange: "#F36A32",
  orangeLight: "#FFF0E8",
  green: "#21876D",
  greenLight: "#E9F5EE",
  red: "#C45148",
  redLight: "#FCEDEA",
  blue: "#4E79A7",
  blueLight: "#EDF3FA",
};
export type IconName = ComponentProps<typeof Feather>["name"];
export function Icon({
  name,
  size = 18,
  color = C.muted,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}
export function Label({ children }: { children: ReactNode }) {
  return <Text style={s.eyebrow}>{children}</Text>;
}
export function Heading({
  children,
  size = 22,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <Text
      style={{
        fontSize: size,
        fontWeight: "700",
        color: C.ink,
        letterSpacing: -0.6,
      }}
    >
      {children}
    </Text>
  );
}
export function Copy({
  children,
  color = C.muted,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <Text style={{ fontSize: 14, lineHeight: 21, color }}>{children}</Text>
  );
}
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Button({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled,
  compact,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  compact?: boolean;
}) {
  const color =
    variant === "primary" ? "#fff" : variant === "danger" ? C.red : C.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          minHeight: compact ? 38 : 46,
          paddingHorizontal: compact ? 12 : 17,
          backgroundColor:
            variant === "primary"
              ? C.orange
              : variant === "danger"
                ? C.redLight
                : variant === "secondary"
                  ? C.paper
                  : "transparent",
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: C.line,
          opacity: disabled ? 0.4 : pressed ? 0.72 : 1,
        },
      ]}
    >
      {icon && <Icon name={icon} color={color} size={17} />}
      <Text style={{ color, fontWeight: "600", fontSize: compact ? 13 : 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Avatar({
  name,
  size = 38,
  color = C.blueLight,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: C.ink, fontSize: size * 0.31, fontWeight: "600" }}>
        {initials(name)}
      </Text>
    </View>
  );
}
export function Plate({ plate }: { plate: string }) {
  return (
    <View style={s.plate}>
      <View style={s.eu}>
        <Text style={{ fontSize: 7, color: "white", fontWeight: "700" }}>
          D
        </Text>
      </View>
      <Text style={s.plateText}>{plate}</Text>
    </View>
  );
}
export function Badge({ status }: { status: OrderStatus }) {
  const tone =
    status === "done"
      ? [C.green, C.greenLight]
      : status === "working"
        ? [C.orange, C.orangeLight]
        : [C.blue, C.blueLight];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: tone[1],
      }}
    >
      <View
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: tone[0],
        }}
      />
      <Text style={{ color: tone[0], fontSize: 11, fontWeight: "600" }}>
        {statusLabels[status]}
      </Text>
    </View>
  );
}
export function Search({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={s.search}>
      <Icon name="search" />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        style={{
          flex: 1,
          fontSize: 14,
          color: C.ink,
          paddingVertical: 12,
          ...Platform.select({
            web: { outlineStyle: "none" as never },
            default: {},
          }),
        }}
      />
      {value ? (
        <Pressable
          accessibilityLabel="Suche leeren"
          onPress={() => onChange("")}
        >
          <Icon name="x" size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}
export function Field({
  label,
  error,
  hint,
  style,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  return (
    <View style={{ gap: 7, flexGrow: 1 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor="#A0A7A3"
        style={[
          s.input,
          props.multiline && { minHeight: 92, textAlignVertical: "top" },
          error && { borderColor: C.red },
          style,
        ]}
      />
      {error ? (
        <Text style={{ fontSize: 12, color: C.red }}>{error}</Text>
      ) : hint ? (
        <Text style={{ fontSize: 11, color: C.muted }}>{hint}</Text>
      ) : null}
    </View>
  );
}
export function FormRow({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  return (
    <View style={{ flexDirection: width < 440 ? "column" : "row", gap: 14 }}>
      {children}
    </View>
  );
}
export function Divider() {
  return (
    <View style={{ height: 1, backgroundColor: C.line, marginVertical: 4 }} />
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <View style={{ alignItems: "center", gap: 13, padding: 35 }}>
      <View style={{ backgroundColor: C.bg, borderRadius: 20, padding: 16 }}>
        <Icon name="inbox" size={27} />
      </View>
      <Heading size={18}>{title}</Heading>
      <Text
        style={{
          color: C.muted,
          fontSize: 14,
          lineHeight: 21,
          textAlign: "center",
          maxWidth: 360,
        }}
      >
        {description}
      </Text>
      {action}
    </View>
  );
}
export function Panel({
  title,
  subtitle,
  children,
  footer,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(20,30,26,0.45)",
          justifyContent: "center",
          alignItems: "center",
          padding: width < 600 ? 10 : 30,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            maxHeight: height - (width < 600 ? 30 : 65),
            backgroundColor: C.paper,
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              padding: 23,
              borderBottomWidth: 1,
              borderBottomColor: C.line,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <View style={{ flex: 1, gap: 5 }}>
              <Heading>{title}</Heading>
              {subtitle && <Copy>{subtitle}</Copy>}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Schließen"
              onPress={onClose}
              style={{ padding: 9, borderRadius: 8, backgroundColor: C.bg }}
            >
              <Icon name="x" />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 23, gap: 19 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer && (
            <View
              style={{
                padding: 18,
                borderTopWidth: 1,
                borderTopColor: C.line,
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {footer}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
export function AlertBox({
  children,
  tone = "warning",
}: {
  children: ReactNode;
  tone?: "warning" | "error";
}) {
  return (
    <View
      style={{
        padding: 13,
        borderRadius: 9,
        backgroundColor: tone === "error" ? C.redLight : C.orangeLight,
        flexDirection: "row",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <Icon name="info" color={tone === "error" ? C.red : C.orange} size={17} />
      <Text
        style={{
          flex: 1,
          color: tone === "error" ? C.red : "#95603D",
          fontSize: 13,
          lineHeight: 20,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
export const s = StyleSheet.create({
  eyebrow: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: C.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    overflow: "hidden",
  },
  button: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  plate: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#DDE2DE",
    backgroundColor: "#FAFBFA",
    overflow: "hidden",
    height: 23,
  },
  eu: {
    width: 10,
    height: "100%",
    backgroundColor: "#4273A9",
    justifyContent: "center",
    alignItems: "center",
  },
  plateText: {
    color: C.ink,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 6,
  },
  search: {
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 9,
    paddingHorizontal: 13,
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 46,
  },
  fieldLabel: { fontSize: 13, color: C.ink, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "#FBFCFA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: C.ink,
    minHeight: 46,
  },
});
