import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatMoney } from "@/lib/money";
import { colors } from "@/lib/theme";
import type { Product } from "@/lib/types";
import ProductImage from "./ProductImage";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.slug}` as Href} asChild>
      <Pressable style={s.card} accessibilityRole="link" accessibilityLabel={product.name}>
        <View style={s.imageBox}><ProductImage path={product.image} style={s.image} /></View>
        {product.isNew && <Text style={s.new}>New product</Text>}
        <Text style={s.name}>{product.name}</Text>
        <Text style={s.price}>{formatMoney(product.priceCents)}</Text>
        {product.stock === 0 && <Text style={s.out}>Out of stock</Text>}
      </Pressable>
    </Link>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 28 },
  imageBox: { backgroundColor: colors.panel, borderRadius: 8, height: 220, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  image: { width: "70%", height: "80%" },
  new: { color: colors.accent, fontSize: 12, letterSpacing: 6, textTransform: "uppercase", marginBottom: 6 },
  name: { fontSize: 20, fontWeight: "700", textTransform: "uppercase", color: colors.ink },
  price: { fontSize: 15, fontWeight: "700", marginTop: 6, color: colors.ink },
  out: { color: colors.danger, marginTop: 4, fontSize: 13 },
});
