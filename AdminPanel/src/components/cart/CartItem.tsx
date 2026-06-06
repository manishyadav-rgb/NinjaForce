"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";

export function CartItem({
  product,
  quantity = 1,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  product: Product;
  quantity?: number;
  onDecrease?: () => void;
  onIncrease?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-background-elevated p-3 shadow-soft">
      <div className="qh-image-shell relative h-24 w-24 shrink-0 rounded-lg">
        <Image src={product.image} alt={product.title} fill sizes="6rem" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex gap-3">
          <h3 className="flex-1 font-semibold text-text-main">{product.title}</h3>
          <button onClick={onRemove} className="text-text-muted hover:text-brand-primary" aria-label="Remove item"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-1 text-sm text-text-muted">Ships in 2-4 days</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="inline-flex items-center rounded-full border border-border">
            <button onClick={onDecrease} className="p-2" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
            <span className="min-w-9 px-3 text-center text-sm font-semibold">{quantity}</span>
            <button onClick={onIncrease} className="p-2" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
          </div>
          <span className="font-bold">{formatPrice(product.price * quantity)}</span>
        </div>
      </div>
    </div>
  );
}

