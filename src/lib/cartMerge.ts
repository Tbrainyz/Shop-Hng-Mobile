/** Pure helpers shared (copy-pasted) by the website's and the mobile app's cart sync. */
type Line = { productId: string; quantity: number };

const MAX_QTY = 99;

/** True when both carts hold the same products in the same quantities (order-insensitive). */
export function sameCart(a: Line[], b: Line[]): boolean {
  if (a.length !== b.length) return false;
  const m = new Map(a.map((i) => [i.productId, i.quantity]));
  return b.every((i) => m.get(i.productId) === i.quantity);
}

/**
 * Used once, at sign-in: a guest cart built before signing in is combined with the cart already saved on the
 * server. Same product in both -> quantities add (capped at 99). Server lines keep their position.
 */
export function mergeCarts<T extends Line>(server: T[], guest: T[]): T[] {
  const out = server.map((i) => ({ ...i }));
  for (const g of guest) {
    const existing = out.find((i) => i.productId === g.productId);
    if (existing) existing.quantity = Math.min(MAX_QTY, existing.quantity + g.quantity);
    else out.push({ ...g });
  }
  return out;
}
