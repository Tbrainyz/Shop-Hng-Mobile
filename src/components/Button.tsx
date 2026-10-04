import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors } from "@/lib/theme";

interface Props { title: string; onPress: () => void; variant?: "primary" | "dark" | "outline"; loading?: boolean; disabled?: boolean }

export default function Button({ title, onPress, variant = "primary", loading, disabled }: Props) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress} disabled={off} accessibilityRole="button" accessibilityState={{ disabled: !!off }}
      style={({ pressed }) => [s.base, s[variant], pressed && { opacity: 0.8 }, off && { opacity: 0.5 }]}
    >
      {loading ? <ActivityIndicator color={variant === "outline" ? colors.ink : colors.white} /> : <Text style={[s.text, variant === "outline" && { color: colors.ink }]}>{title}</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: { minHeight: 48, paddingHorizontal: 28, alignItems: "center", justifyContent: "center", borderRadius: 2 },
  primary: { backgroundColor: colors.accent },
  dark: { backgroundColor: colors.ink },
  outline: { borderWidth: 1, borderColor: colors.ink, backgroundColor: "transparent" },
  text: { color: colors.white, fontWeight: "700", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" },
});
