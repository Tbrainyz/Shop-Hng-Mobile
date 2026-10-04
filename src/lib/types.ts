// Same shapes the Next.js API returns (copied from the web project's lib/types.ts).
export interface ProductInclude { quantity: number; item: string }
export interface Product {
  id: string; slug: string; name: string; description: string; category: string;
  priceCents: number; stock: number; image: string; gallery: string[]; features: string;
  includes: ProductInclude[]; related: string[]; isNew: boolean; featured: boolean;
}
export interface Shipping { name: string; address: string; city: string; state: string; postalCode: string; country: string; phone: string }
export interface OrderLineItem { productId: string; name: string; priceCents: number; quantity: number }
export interface Order {
  id: string; userId: string; userEmail: string; paystackReference: string;
  subtotalCents: number; shippingCents: number; totalCents: number;
  shipping: Shipping; items: OrderLineItem[]; createdAt: string;
}
export interface User { id: string; email: string }
