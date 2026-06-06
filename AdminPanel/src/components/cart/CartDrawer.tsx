"use client";

import { X } from "lucide-react";
import { formatPrice } from "@/data/products";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useShop } from "@/components/shop/ShopProvider";
import { CartItem } from "./CartItem";

export function CartDrawer({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const { cart, subtotal, addToCart, removeFromCart, updateCartQuantity } = useShop();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-drawer qh-scrim">
      <aside className="ml-auto flex h-full qh-cart-panel flex-col bg-background-main p-5 shadow-dropdown">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="font-display text-2xl font-semibold">Your Cart</h2>
          <button onClick={onClose} className="qh-focus rounded-full p-2 text-text-muted hover:bg-background-soft" aria-label="Close cart"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-3 overflow-y-auto py-5">
          {cart.length ? cart.map(({ product, quantity }) => (
            <CartItem
              key={product.slug}
              product={product}
              quantity={quantity}
              onDecrease={() => updateCartQuantity(product.slug, quantity - 1)}
              onIncrease={() => addToCart(product)}
              onRemove={() => removeFromCart(product.slug)}
            />
          )) : <p className="rounded-lg bg-background-soft p-4 text-sm text-text-muted">Your cart is empty.</p>}
        </div>
        <div className="mt-auto border-t border-border pt-5">
          <div className="mb-4 flex items-center justify-between text-lg font-semibold"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <ButtonLink href="/cart" className="w-full">Checkout Securely</ButtonLink>
        </div>
      </aside>
    </div>
  );
}

