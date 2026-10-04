import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "@/components/Button";
import Line from "@/components/Line";
import { ErrorState, Loading } from "@/components/State";
import { api, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { colors } from "@/lib/theme";
import type { Order } from "@/lib/types";

export default function OrderScreen() {
  const { id, email } = useLocalSearchParams<{ id: string; email?: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setOrder(await api<Order>(`/api/orders/${id}`));
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? "Order not found." : e instanceof ApiError && e.status === 401 ? "Sign in to view this order." : (e as Error).message);
    }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return <Loading />;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={s.tick}><Text style={{ color: colors.accent, fontSize: 28 }}>✓</Text></View>
      <Text style={s.h1}>Order confirmed</Text>
      <Text style={s.muted}>Order #{order.id.slice(0, 8)} is confirmed.</Text>

      {email === "sent" && <Text style={[s.banner, { backgroundColor: "#E8F5E9", color: "#1B5E20" }]}>Confirmation email sent to {order.userEmail}. If it doesn&apos;t appear shortly, check your spam folder.</Text>}
      {email === "failed" && <Text style={[s.banner, { backgroundColor: "#FBEADF", color: "#8A4828" }]}>Your order is saved, but we couldn&apos;t send the confirmation email to {order.userEmail}.</Text>}

      <View style={{ gap: 10, marginVertical: 24 }}>
        {order.items.map((i) => <Line key={i.productId} label={`${i.quantity} × ${i.name}`} value={formatMoney(i.priceCents * i.quantity)} />)}
      </View>
      <View style={{ gap: 8 }}>
        <Line label="Subtotal" value={formatMoney(order.subtotalCents)} />
        <Line label="Shipping" value={formatMoney(order.shippingCents)} />
        <Line label="Total" value={formatMoney(order.totalCents)} accent />
      </View>

      <Text style={s.h2}>Shipping to</Text>
      <Text style={s.muted}>{order.shipping.name}{"\n"}{order.shipping.address}{"\n"}{order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}{"\n"}{order.shipping.country}</Text>

      <View style={{ marginTop: 32 }}><Button title="Back to home" onPress={() => router.replace("/")} /></View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  tick: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(216,125,74,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  h1: { fontSize: 26, fontWeight: "700", textTransform: "uppercase", marginBottom: 6 },
  h2: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", color: colors.muted, marginTop: 28, marginBottom: 8 },
  muted: { color: colors.muted, lineHeight: 24 },
  banner: { padding: 14, borderRadius: 8, marginTop: 16, fontSize: 14, lineHeight: 20 },
});
