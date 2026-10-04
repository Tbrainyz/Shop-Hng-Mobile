import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { api } from "./api";
import { useAuth } from "./auth";
import { mergeCarts, sameCart } from "./cartMerge";
import type { Product } from "./types";

export interface CartItem { productId: string; name: string; image: string; priceCents: number; quantity: number }
interface CartValue {
  items: CartItem[]; count: number;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}
const CartContext = createContext<CartValue | null>(null);
const KEY = "cart:v1";
const POLL_MS = 2000;          // how often a signed-in app asks "did my cart change on another device?"
const PUSH_DEBOUNCE_MS = 200;  // collapse rapid +/- taps into one save
const MAX_QTY = 99;

type ServerCart = { items: CartItem[]; rev: number; unchanged?: boolean };
const fetchCart = (since?: number) => api<ServerCart>(since === undefined ? "/api/cart" : `/api/cart?since=${since}`);
const saveCart = (items: CartItem[]) =>
  api<ServerCart>("/api/cart", { method: "PUT", body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }) });

/**
 * Same design as the website's cart (lib/cartContext.tsx in the Next.js project):
 *  - Signed out: the cart lives on this phone only (AsyncStorage).
 *  - Signed in: the SERVER cart (/api/cart) is the source of truth, shared with the website. Every change is pushed
 *    (debounced); every 2s while the app is open (and the moment it returns to the foreground) we check whether the
 *    cart changed elsewhere and show it. A guest cart is merged into the saved cart once, at sign-in.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const authed = status === "signedIn";
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const itemsRef = useRef<CartItem[]>([]);
  const authedRef = useRef(false);
  const synced = useRef(false);
  const rev = useRef(0);
  const dirty = useRef(false);
  const localVersion = useRef(0);
  const inFlight = useRef(false);
  const again = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const commit = useCallback((next: CartItem[]) => { itemsRef.current = next; setItems(next); }, []);

  // Guest cart saved on this phone.
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => { const parsed = raw ? JSON.parse(raw) : []; if (Array.isArray(parsed) && itemsRef.current.length === 0) commit(parsed); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [commit]);

  // Only guests persist locally; for signed-in users the server is the truth (a stale local copy can't resurrect removed items).
  useEffect(() => {
    if (loaded && status === "signedOut") AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});
  }, [items, loaded, status]);

  const flush = useCallback(async () => {
    if (!authedRef.current || !synced.current) return;
    if (inFlight.current) { again.current = true; return; }
    inFlight.current = true;
    try {
      do {
        again.current = false;
        const v = localVersion.current;
        const res = await saveCart(itemsRef.current);
        rev.current = res.rev;
        if (v === localVersion.current) dirty.current = false;
        else again.current = true; // changed while saving: save again
      } while (again.current && authedRef.current);
    } catch {
      /* offline / server error: stays dirty and is retried on the next poll tick */
    } finally {
      inFlight.current = false;
    }
  }, []);

  const mutate = useCallback((fn: (prev: CartItem[]) => CartItem[]) => {
    commit(fn(itemsRef.current));
    localVersion.current += 1;
    dirty.current = true;
    if (authedRef.current) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => { void flush(); }, PUSH_DEBOUNCE_MS);
    }
  }, [commit, flush]);

  // Sign-in reconcile + live polling.
  useEffect(() => {
    authedRef.current = authed;
    if (!loaded) return;

    if (!authed) {
      if (synced.current) {
        // signed out: don't leave their cart on this phone
        commit([]);
        AsyncStorage.removeItem(KEY).catch(() => {});
      }
      synced.current = false; rev.current = 0; dirty.current = false;
      return;
    }

    let stop = false;
    let reconciling = false;

    const reconcile = async () => {
      if (reconciling) return;
      reconciling = true;
      try {
        const res = await fetchCart();
        if (stop) return;
        const guest = itemsRef.current;
        rev.current = res.rev;
        if (guest.length === 0 || sameCart(guest, res.items)) {
          commit(res.items);
        } else {
          commit(mergeCarts(res.items, guest));
          localVersion.current += 1;
          dirty.current = true;
        }
        AsyncStorage.removeItem(KEY).catch(() => {});
        synced.current = true;
        if (dirty.current) void flush();
      } finally {
        reconciling = false;
      }
    };

    const tick = async () => {
      if (stop || AppState.currentState !== "active") return;
      if (!synced.current) { void reconcile().catch(() => {}); return; }
      if (dirty.current || inFlight.current) {
        if (dirty.current && !inFlight.current) void flush(); // retry a failed save
        return;
      }
      try {
        const v = localVersion.current;
        const res = await fetchCart(rev.current);
        if (stop || res.unchanged) return;
        if (v !== localVersion.current || dirty.current || inFlight.current) return; // user edited meanwhile: their change wins
        rev.current = res.rev;
        if (JSON.stringify(res.items) !== JSON.stringify(itemsRef.current)) commit(res.items);
      } catch { /* offline: try again next tick */ }
    };

    void reconcile().catch(() => {});
    const id = setInterval(() => { void tick(); }, POLL_MS);
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") void tick(); });
    return () => { stop = true; clearInterval(id); clearTimeout(timer.current); sub.remove(); };
  }, [authed, loaded, commit, flush]);

  const add = useCallback((p: Product, quantity = 1) => {
    mutate((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) return prev.map((i) => (i.productId === p.id ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + quantity) } : i));
      return [...prev, { productId: p.id, name: p.name, image: p.image, priceCents: p.priceCents, quantity: Math.min(MAX_QTY, quantity) }];
    });
  }, [mutate]);
  const setQuantity = useCallback((productId: string, quantity: number) => {
    mutate((prev) => (quantity <= 0 ? prev.filter((i) => i.productId !== productId) : prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i))));
  }, [mutate]);
  const clear = useCallback(() => mutate(() => []), [mutate]);

  const value = useMemo(() => ({ items, count: items.reduce((n, i) => n + i.quantity, 0), add, setQuantity, clear }), [items, add, setQuantity, clear]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
