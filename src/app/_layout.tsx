import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import CartButton from "@/components/CartButton";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { colors } from "@/lib/theme";

// Like app/layout.tsx on the web: wraps every screen. Each file in this folder is a screen/route.
export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.ink },
            headerTintColor: colors.white,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: colors.bg },
            headerRight: () => <CartButton />,
          }}
        >
          <Stack.Screen name="index" options={{ title: "Shop-Hng" }} />
          <Stack.Screen name="product/[slug]" options={{ title: "" }} />
          <Stack.Screen name="cart" options={{ title: "Cart", headerRight: () => null }} />
          <Stack.Screen name="checkout" options={{ title: "Checkout", headerRight: () => null }} />
          <Stack.Screen name="order/[id]" options={{ title: "Order", headerBackVisible: false, headerRight: () => null }} />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
