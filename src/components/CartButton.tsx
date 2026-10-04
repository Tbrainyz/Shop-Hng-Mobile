import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCart } from "@/lib/cart";
import { colors } from "@/lib/theme";

export default function CartButton() {
  const { count } = useCart();
  return (
    <Link href="/cart" asChild>
      <Pressable style={s.btn} accessibilityRole="button" accessibilityLabel={`Cart, ${count} items`}>
        <Text style={s.label}>Cart</Text>
        {count > 0 && <View style={s.badge}><Text style={s.badgeText}>{count}</Text></View>}
      </Pressable>
    </Link>
  );
}

const s = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 6 },
  label: { color: colors.white, fontWeight: "700" },
  badge: { backgroundColor: colors.accent, minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: "700" },
});
