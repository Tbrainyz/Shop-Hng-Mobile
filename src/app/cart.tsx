import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "@/components/Button";
import Line from "@/components/Line";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/lib/cart";
import { computeTotals, formatMoney } from "@/lib/money";
import { colors } from "@/lib/theme";

export default function CartScreen() {
  const router = useRouter();
  const { items, setQuantity, clear } = useCart();
  const totals = computeTotals(items);

  if (items.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={{ color: colors.muted, fontSize: 16 }}>Your cart is empty.</Text>
        <Button title="Continue shopping" variant="dark" onPress={() => router.replace("/")} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={s.headRow}>
        <Text style={s.h1}>Cart ({items.reduce((n, i) => n + i.quantity, 0)})</Text>
        <Pressable onPress={clear}><Text style={{ color: colors.muted, textDecorationLine: "underline" }}>Remove all</Text></Pressable>
      </View>

      {items.map((i) => (
        <View key={i.productId} style={s.row}>
          <View style={s.thumb}><ProductImage path={i.image} style={{ width: 44, height: 44 }} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.name} numberOfLines={2}>{i.name}</Text>
            <Text style={s.price}>{formatMoney(i.priceCents)}</Text>
          </View>
          <View style={s.stepper}>
            <Pressable onPress={() => setQuantity(i.productId, i.quantity - 1)} style={s.stepBtn} accessibilityLabel={`Decrease ${i.name}`}><Text style={s.stepText}>−</Text></Pressable>
            <Text style={s.qty}>{i.quantity}</Text>
            <Pressable onPress={() => setQuantity(i.productId, i.quantity + 1)} style={s.stepBtn} accessibilityLabel={`Increase ${i.name}`}><Text style={s.stepText}>+</Text></Pressable>
          </View>
        </View>
      ))}

      <View style={{ marginTop: 24, gap: 8 }}>
        <Line label="Subtotal" value={formatMoney(totals.subtotalCents)} />
        <Line label="Shipping" value={formatMoney(totals.shippingCents)} />
        <Line label="Total" value={formatMoney(totals.totalCents)} accent />
      </View>
      <View style={{ marginTop: 28 }}><Button title="Checkout" onPress={() => router.push("/checkout")} /></View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 32 },
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  h1: { fontSize: 20, fontWeight: "700", textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: colors.panel, alignItems: "center", justifyContent: "center" },
  name: { fontWeight: "700", fontSize: 14, textTransform: "uppercase" },
  price: { color: colors.muted, marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: colors.panel },
  stepBtn: { width: 34, height: 40, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 16, fontWeight: "700", color: colors.muted },
  qty: { width: 24, textAlign: "center", fontWeight: "700" },
});
