"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { products, type Product } from "@/data/products";

type CartLine = {
  slug: string;
  quantity: number;
  product?: Product;
};

type CartProductLine = {
  product: Product;
  quantity: number;
  lineTotal: number;
};

type ShopContextValue = {
  cart: CartProductLine[];
  wishlist: Product[];
  cartCount: number;
  wishlistCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (slug: string) => void;
  updateCartQuantity: (slug: string, quantity: number) => void;
  isInCart: (slug: string) => boolean;
  toggleWishlist: (product: Product) => void;
  isWishlisted: (slug: string) => boolean;
};

type MeResponse = { role?: "customer" | "team" | "admin" };

type ApiCartItem = {
  product_slug: string;
  quantity: number;
};

type ApiWishlistItem = {
  product_slug: string;
};

const CART_KEY = "qh_cart";
const WISHLIST_KEY = "qh_wishlist";

const ShopContext = createContext<ShopContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function productBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

async function getCustomerAuth(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as MeResponse;
    return data.role === "customer";
  } catch {
    return false;
  }
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [wishlistSlugs, setWishlistSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isCustomerAuthed, setIsCustomerAuthed] = useState(false);

  const syncFromServer = useCallback(async () => {
    const [cartRes, wishlistRes] = await Promise.all([
      fetch("/api/cart", { cache: "no-store" }),
      fetch("/api/wishlist", { cache: "no-store" }),
    ]);

    if (cartRes.ok) {
      const cartData = await cartRes.json();
      const items = (cartData.items || []) as ApiCartItem[];
      setCartLines(
        items
          .map((item) => ({
            slug: item.product_slug,
            quantity: item.quantity,
            product: productBySlug(item.product_slug),
          }))
          .filter((item) => item.product),
      );
    }

    if (wishlistRes.ok) {
      const wishlistData = await wishlistRes.json();
      const items = (wishlistData.items || []) as ApiWishlistItem[];
      setWishlistSlugs(items.map((item) => item.product_slug));
    }
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const authed = await getCustomerAuth();
      if (!active) return;

      setIsCustomerAuthed(authed);

      if (authed) {
        await syncFromServer();
      } else {
        setCartLines(readJson<CartLine[]>(CART_KEY, []));
        setWishlistSlugs(readJson<string[]>(WISHLIST_KEY, []));
      }

      setHydrated(true);
    };

    init();

    return () => {
      active = false;
    };
  }, [syncFromServer]);

  useEffect(() => {
    if (!hydrated || isCustomerAuthed) return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(cartLines));
  }, [cartLines, hydrated, isCustomerAuthed]);

  useEffect(() => {
    if (!hydrated || isCustomerAuthed) return;
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistSlugs));
  }, [wishlistSlugs, hydrated, isCustomerAuthed]);

  const requireCustomerLogin = useCallback(async () => {
    const authed = await getCustomerAuth();
    setIsCustomerAuthed(authed);
    if (authed) return true;
    window.location.href = "/account";
    return false;
  }, []);

  const addToCart = useCallback(async (product: Product, quantity = 1) => {
    const ok = await requireCustomerLogin();
    if (!ok) return;

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: product.slug,
        title: product.title,
        image: product.image,
        price: product.price,
        mrp: product.mrp,
        quantity,
      }),
    });

    if (res.ok) await syncFromServer();
  }, [requireCustomerLogin, syncFromServer]);

  const removeFromCart = useCallback(async (slug: string) => {
    const ok = await requireCustomerLogin();
    if (!ok) return;

    const res = await fetch(`/api/cart?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    if (res.ok) await syncFromServer();
  }, [requireCustomerLogin, syncFromServer]);

  const updateCartQuantity = useCallback(async (slug: string, quantity: number) => {
    const ok = await requireCustomerLogin();
    if (!ok) return;

    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, quantity }),
    });

    if (res.ok) await syncFromServer();
  }, [requireCustomerLogin, syncFromServer]);

  const toggleWishlist = useCallback(async (product: Product) => {
    const ok = await requireCustomerLogin();
    if (!ok) return;

    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: product.slug,
        title: product.title,
        image: product.image,
        price: product.price,
      }),
    });

    if (res.ok) await syncFromServer();
  }, [requireCustomerLogin, syncFromServer]);

  const cart = useMemo(
    () =>
      cartLines.flatMap((line) => {
        const product = line.product ?? productBySlug(line.slug);
        return product ? [{ product, quantity: line.quantity, lineTotal: product.price * line.quantity }] : [];
      }),
    [cartLines],
  );

  const wishlist = useMemo(
    () => wishlistSlugs.flatMap((slug) => {
      const product = productBySlug(slug);
      return product ? [product] : [];
    }),
    [wishlistSlugs],
  );

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);

  const value = useMemo<ShopContextValue>(() => ({
    cart,
    wishlist,
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    wishlistCount: wishlist.length,
    subtotal,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    isInCart: (slug) => cartLines.some((item) => item.slug === slug),
    toggleWishlist,
    isWishlisted: (slug) => wishlistSlugs.includes(slug),
  }), [addToCart, cart, cartLines, removeFromCart, subtotal, toggleWishlist, updateCartQuantity, wishlist, wishlistSlugs]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used inside ShopProvider");
  return context;
}
