// EXPO_PUBLIC_* variables are baked into the app at start-up (see .env.example).
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";
export const CURRENCY: "NGN" | "USD" = process.env.EXPO_PUBLIC_CURRENCY === "USD" ? "USD" : "NGN";
