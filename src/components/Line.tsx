import { Text, View } from "react-native";
import { colors } from "@/lib/theme";

export default function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ color: colors.muted, textTransform: "uppercase", fontSize: 13 }}>{label}</Text>
      <Text style={{ fontWeight: "700", fontSize: accent ? 18 : 15, color: accent ? colors.accent : colors.ink }}>{value}</Text>
    </View>
  );
}
