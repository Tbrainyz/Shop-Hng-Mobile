import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import ProductCard from "@/components/ProductCard";
import { ErrorState, Loading } from "@/components/State";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";
import type { Product } from "@/lib/types";

const CATEGORIES = ["all", "headphones", "speakers", "earphones"] as const;

export default function Home() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");

  const load = useCallback(async () => {
    try {
      setError(null);
      setProducts(await api<Product[]>("/api/products"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => (products ?? []).filter((p) => category === "all" || p.category === category), [products, category]);

  if (error && !products) return <ErrorState message={error} onRetry={load} />;
  if (!products) return <Loading />;

  return (
    <FlatList
      data={visible}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <ProductCard product={item} />}
      contentContainerStyle={{ padding: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.accent} />}
      ListHeaderComponent={
        <View style={{ marginBottom: 20 }}>
          <Text style={s.title}>Premium audio gear</Text>
          <View style={s.chips}>
            {CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => setCategory(c)} style={[s.chip, category === c && s.chipOn]} accessibilityRole="button" accessibilityState={{ selected: category === c }}>
                <Text style={[s.chipText, category === c && { color: colors.white }]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={{ textAlign: "center", color: colors.muted, marginTop: 40 }}>Nothing in this category yet.</Text>}
    />
  );
}

const s = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "700", textTransform: "uppercase", color: colors.ink, marginBottom: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.panel },
  chipOn: { backgroundColor: colors.ink },
  chipText: { textTransform: "capitalize", fontWeight: "600", color: colors.ink },
});
