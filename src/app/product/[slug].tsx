import { Stack, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import Button from "@/components/Button";
import ProductImage from "@/components/ProductImage";
import { ErrorState, Loading } from "@/components/State";
import { api, ApiError } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { colors } from "@/lib/theme";
import type { Product } from "@/lib/types";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const p = await api<Product>(`/api/products/${slug}`);
      setProduct(p);
      setQty(1);
      setAdded(false);
      // Related products are stored as slugs; fetch each (best-effort).
      const rel = await Promise.all(p.related.map((r) => api<Product>(`/api/products/${r}`).catch(() => null)));
      setRelated(rel.filter((x): x is Product => !!x));
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? "Product not found." : (e as Error).message);
    }
  }, [slug]);
  useEffect(() => { void load(); }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!product) return <Loading />;

  const soldOut = product.stock <= 0;
  const maxQty = Math.min(99, product.stock);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <Stack.Screen options={{ title: product.category }} />
      <View style={s.imageBox}><ProductImage path={product.image} style={{ width: "75%", height: "85%" }} /></View>

      {product.isNew && <Text style={s.new}>New product</Text>}
      <Text style={s.name}>{product.name}</Text>
      <Text style={s.desc}>{product.description}</Text>
      <Text style={s.price}>{formatMoney(product.priceCents)}</Text>

      {soldOut ? (
        <Text style={{ color: colors.danger, fontWeight: "700" }}>Out of stock</Text>
      ) : (
        <View style={s.buyRow}>
          <View style={s.stepper}>
            <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={s.stepBtn} accessibilityLabel="Decrease quantity"><Text style={s.stepText}>−</Text></Pressable>
            <Text style={s.qty}>{qty}</Text>
            <Pressable onPress={() => setQty((q) => Math.min(maxQty, q + 1))} style={s.stepBtn} accessibilityLabel="Increase quantity"><Text style={s.stepText}>+</Text></Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Button title={added ? "Added ✓" : "Add to cart"} onPress={() => { add(product, qty); setAdded(true); }} />
          </View>
        </View>
      )}
      {added && <Link href="/cart" style={s.viewCart}>View cart →</Link>}

      <Text style={s.h2}>Features</Text>
      {product.features.split("\n\n").map((para, i) => <Text key={i} style={s.body}>{para}</Text>)}

      <Text style={s.h2}>In the box</Text>
      {product.includes.map((inc) => (
        <Text key={inc.item} style={s.body}><Text style={{ color: colors.accent, fontWeight: "700" }}>{inc.quantity}x  </Text>{inc.item}</Text>
      ))}

      {product.gallery.length > 0 && (
        <View style={{ gap: 12, marginTop: 28 }}>
          {product.gallery.map((g) => <ProductImage key={g} path={g} style={{ width: "100%", aspectRatio: 1.4, borderRadius: 8 }} />)}
        </View>
      )}

      {related.length > 0 && (
        <>
          <Text style={[s.h2, { textAlign: "center" }]}>You may also like</Text>
          {related.map((r) => (
            <Link key={r.id} href={`/product/${r.slug}` as Href} asChild>
              <Pressable style={{ alignItems: "center", marginBottom: 24 }}>
                <View style={[s.imageBox, { height: 160, width: "100%" }]}><ProductImage path={r.image} style={{ width: "60%", height: "80%" }} /></View>
                <Text style={{ fontWeight: "700", textTransform: "uppercase", fontSize: 16 }}>{r.name}</Text>
              </Pressable>
            </Link>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  imageBox: { backgroundColor: colors.panel, borderRadius: 8, height: 300, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  new: { color: colors.accent, fontSize: 12, letterSpacing: 6, textTransform: "uppercase", marginBottom: 8 },
  name: { fontSize: 28, fontWeight: "700", textTransform: "uppercase", color: colors.ink, marginBottom: 14 },
  desc: { color: colors.muted, lineHeight: 26, fontSize: 15, marginBottom: 18 },
  price: { fontSize: 18, fontWeight: "700", marginBottom: 20 },
  buyRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: colors.panel },
  stepBtn: { width: 40, height: 48, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 18, fontWeight: "700", color: colors.muted },
  qty: { width: 32, textAlign: "center", fontWeight: "700" },
  viewCart: { color: colors.accent, fontWeight: "700", marginTop: 14 },
  h2: { fontSize: 22, fontWeight: "700", textTransform: "uppercase", marginTop: 36, marginBottom: 14 },
  body: { color: colors.muted, lineHeight: 26, fontSize: 15, marginBottom: 10 },
});
