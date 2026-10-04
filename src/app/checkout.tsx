import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";
import Button from "@/components/Button";
import Line from "@/components/Line";
import PaystackSheet from "@/components/PaystackSheet";
import { Loading } from "@/components/State";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { CURRENCY, PAYSTACK_PUBLIC_KEY } from "@/lib/config";
import { computeTotals, formatMoney } from "@/lib/money";
import { colors } from "@/lib/theme";
import type { Shipping } from "@/lib/types";

const EMPTY: Shipping = { name: "", address: "", city: "", state: "", postalCode: "", country: "Nigeria", phone: "" };
const LABELS: [keyof Shipping, string, KeyboardTypeOptions?][] = [
  ["name", "Name"], ["phone", "Phone number", "phone-pad"], ["address", "Address"], ["city", "City"],
  ["state", "State"], ["postalCode", "Postal code"], ["country", "Country"],
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, clear } = useCart();
  const { status, user, signIn } = useAuth();
  const [shipping, setShipping] = useState<Shipping>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reference, setReference] = useState("");
  // Set once Paystack has charged the card. If saving the order then fails (e.g. network), we keep the
  // reference so "Retry" re-sends the SAME payment instead of asking the customer to pay again.
  const [paidReference, setPaidReference] = useState<string | null>(null);
  const totals = computeTotals(items);

  if (status === "loading") return <Loading />;

  if (items.length === 0) {
    return <View style={s.center}><Text style={{ color: colors.muted }}>Your cart is empty.</Text><Button title="Continue shopping" variant="dark" onPress={() => router.replace("/")} /></View>;
  }

  if (status === "signedOut") {
    return (
      <View style={s.center}>
        <Text style={s.h1}>Sign in to checkout</Text>
        <Text style={{ color: colors.muted, textAlign: "center" }}>We need your Google account so we can send your order confirmation.</Text>
        {error && <Text style={s.error}>{error}</Text>}
        <Button title="Sign in with Google" onPress={async () => {
          setError(null);
          try { if (!(await signIn())) setError("Sign-in was cancelled."); } catch (e) { setError((e as Error).message); }
        }} />
      </View>
    );
  }

  const finalize = async (ref: string) => {
    setSaving(true);
    setError(null);
    try {
      const data = await api<{ orderId: string; emailSent: boolean }>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })), shipping, paystackReference: ref }),
      });
      clear();
      router.replace(`/order/${data.orderId}?email=${data.emailSent ? "sent" : "failed"}` as Href);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const startPayment = () => {
    setError(null);
    const missing = LABELS.find(([k]) => !shipping[k].trim());
    if (missing) return setError(`${missing[1]} is required.`);
    if (!PAYSTACK_PUBLIC_KEY) return setError("Payments aren't configured: set EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY in .env and restart Expo.");
    setReference(`hng_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    setPayOpen(true);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={s.h1}>Shipping details</Text>
        {LABELS.map(([key, label, keyboard]) => (
          <View key={key} style={{ marginBottom: 16 }}>
            <Text style={s.label}>{label}</Text>
            <TextInput
              value={shipping[key]} onChangeText={(v) => setShipping((p) => ({ ...p, [key]: v }))}
              keyboardType={keyboard} maxLength={200} style={s.input} editable={!saving} accessibilityLabel={label}
            />
          </View>
        ))}

        <View style={s.summary}>
          <Text style={s.h2}>Summary</Text>
          {items.map((i) => <Line key={i.productId} label={`${i.quantity} × ${i.name}`} value={formatMoney(i.priceCents * i.quantity)} />)}
          <View style={{ height: 8 }} />
          <Line label="Shipping" value={formatMoney(totals.shippingCents)} />
          <Line label="Total" value={formatMoney(totals.totalCents)} accent />
        </View>

        {error && <Text style={s.error}>{error}</Text>}

        {paidReference ? (
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.muted }}>Your payment went through, but the order wasn&apos;t saved yet. Retrying won&apos;t charge you again.</Text>
            <Button title="Retry saving order" loading={saving} onPress={() => finalize(paidReference)} />
          </View>
        ) : (
          <Button title={`Pay ${formatMoney(totals.totalCents)}`} loading={saving} onPress={startPayment} />
        )}
        <Text style={s.note}>Secured by Paystack. Card details never touch this app or our server.</Text>
      </ScrollView>

      <PaystackSheet
        visible={payOpen}
        publicKey={PAYSTACK_PUBLIC_KEY} email={user?.email ?? ""} amountMinor={totals.totalCents} currency={CURRENCY} reference={reference}
        onSuccess={(ref) => { setPayOpen(false); setPaidReference(ref); void finalize(ref); }}
        onCancel={() => setPayOpen(false)}
        onError={(m) => { setPayOpen(false); setError(m); }}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 32 },
  h1: { fontSize: 24, fontWeight: "700", textTransform: "uppercase", marginBottom: 20 },
  h2: { fontSize: 16, fontWeight: "700", textTransform: "uppercase", marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6, color: "rgba(0,0,0,0.7)" },
  input: { borderWidth: 1, borderColor: "#cfcfcf", borderRadius: 6, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, backgroundColor: colors.white },
  summary: { backgroundColor: colors.white, borderRadius: 8, padding: 18, gap: 8, marginVertical: 20 },
  error: { color: colors.danger, marginBottom: 14, textAlign: "center" },
  note: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 14 },
});
