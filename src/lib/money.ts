import { CURRENCY } from "./config";

// Ported from the web project's lib/currency.ts + lib/cart.ts. The server recomputes all of this
// from DB prices at checkout — what's shown here is only a preview.
export function formatMoney(minorUnits: number, currency: string = CURRENCY): string {
  try {
    return new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", { style: "currency", currency }).format(minorUnits / 100);
  } catch {
    return `${currency} ${(minorUnits / 100).toFixed(2)}`;
  }
}

const SHIPPING_RATE = 0.1;
export function computeTotals(items: { priceCents: number; quantity: number }[]) {
  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const shippingCents = items.length === 0 ? 0 : Math.round(subtotalCents * SHIPPING_RATE);
  return { subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents };
}
