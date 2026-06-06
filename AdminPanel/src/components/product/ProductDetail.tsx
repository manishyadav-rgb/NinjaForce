"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Heart, MapPin, RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import type { Product } from "@/data/products";
import { discountFor, formatPrice } from "@/data/products";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useShop } from "@/components/shop/ShopProvider";
import { RatingStars } from "./RatingStars";
import { useEffect } from "react";

const RECENT_KEY = "qh_recently_viewed_products_v1";

export function ProductDetail({ product }: { product: Product }) {
  const variants = product.variants || [];
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id || "");
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || variants[0];
  const activePrice = selectedVariant?.salePrice ?? product.price;
  const activeMrp = selectedVariant?.mrp ?? product.mrp;
  const activeImage = selectedVariant?.image || product.image;
  const discount = discountFor(activePrice, activeMrp);
  const { addToCart, isInCart, isWishlisted, toggleWishlist } = useShop();
  const inCart = isInCart(product.slug);
  const wishlisted = isWishlisted(product.slug);
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "ok" | "error">("idle");
  const [pincodeMessage, setPincodeMessage] = useState("");

  useEffect(() => {
    try {
      const current = {
        slug: product.slug,
        title: product.title,
        image: product.image,
        price: product.price,
        mrp: product.mrp,
      };
      const raw = window.localStorage.getItem(RECENT_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const deduped = [current, ...list.filter((item: any) => item?.slug !== product.slug)].slice(0, 10);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(deduped));
    } catch {
      // ignore localStorage errors
    }
  }, [product.slug, product.title, product.image, product.price, product.mrp]);

  const handlePincodeCheck = () => {
    const clean = pincode.trim();
    if (!/^\d{6}$/.test(clean)) {
      setPincodeStatus("error");
      setPincodeMessage("Please enter a valid 6-digit pincode.");
      return;
    }
    if (clean.startsWith("0")) {
      setPincodeStatus("error");
      setPincodeMessage("Delivery is currently unavailable for this pincode.");
      return;
    }

    const from = new Date();
    const to = new Date();
    from.setDate(from.getDate() + 3);
    to.setDate(to.getDate() + 6);
    const format = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

    setPincodeStatus("ok");
    setPincodeMessage(`Delivery between ${format(from)} - ${format(to)}. Cash on Delivery available.`);
  };

  return (
    <section className="qh-container qh-section-pad grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="grid gap-4 qh-detail-gallery-grid">
        <div className="order-2 grid grid-cols-2 gap-3 md:order-1 md:grid-cols-1">
          {product.gallery.map((image) => (
            <div key={image} className="qh-image-shell relative h-20 rounded-lg border border-border">
              <Image src={image} alt={product.title} fill sizes="5rem" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="qh-image-shell relative order-1 qh-product-detail-image rounded-2xl md:order-2">
          <Image src={activeImage} alt={product.title} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
      </div>

      <div className="qh-card p-6 lg:p-8">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="sale">{discount}% Off</Badge>
          <Badge variant="secondary">{product.badge}</Badge>
        </div>
        <h1 className="font-display text-4xl font-semibold text-text-main text-balance">{product.title}</h1>
        <p className="mt-4 text-text-muted leading-relaxed">{product.description}</p>
        <div className="mt-5">
          <RatingStars rating={product.rating} reviews={product.reviews} />
        </div>
        <div className="mt-6 flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-bold text-text-main">{formatPrice(activePrice)}</span>
          <span className="text-lg text-text-soft line-through">{formatPrice(activeMrp)}</span>
          <span className="font-semibold text-accent-discount">Inclusive of all taxes</span>
        </div>
        {variants.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-text-main">Related Variants</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => {
                const label =
                  (typeof variant.attributes?.size === "string" && variant.attributes.size) ||
                  (typeof variant.attributes?.color === "string" && variant.attributes.color) ||
                  variant.title ||
                  variant.sku ||
                  "Variant";
                const active = variant.id === selectedVariant?.id;
                const body = (
                  <>
                    {variant.image ? (
                      <span className="relative h-8 w-8 overflow-hidden rounded-md border border-border">
                        <Image src={variant.image} alt={String(label)} fill sizes="32px" className="object-cover" />
                      </span>
                    ) : null}
                    {label}
                  </>
                );
                if (variant.linkedProductSlug) {
                  return (
                    <Link
                      key={variant.id}
                      href={`/${variant.linkedProductSlug}`}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                        active
                          ? "border-brand-primary bg-brand-primary text-text-inverse"
                          : "border-border bg-background-elevated text-text-main"
                      }`}
                    >
                      {body}
                    </Link>
                  );
                }
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? "border-brand-primary bg-brand-primary text-text-inverse"
                        : "border-border bg-background-elevated text-text-main"
                    }`}
                  >
                    {body}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="mt-6 rounded-2xl border border-border bg-gradient-to-br from-background-soft to-background-elevated p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-primary" />
            <p className="text-sm font-semibold text-text-main">Check Delivery by Pincode</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePincodeCheck();
              }}
              placeholder="Enter 6-digit pincode"
              className="h-11 flex-1 rounded-xl border border-border bg-white px-3 text-sm text-text-main outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
            <Button type="button" size="lg" variant="outline" onClick={handlePincodeCheck}>
              Check
            </Button>
          </div>
          {pincodeStatus !== "idle" && (
            <div
              className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${
                pincodeStatus === "ok"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {pincodeStatus === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <p>{pincodeMessage}</p>
            </div>
          )}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button
            size="lg"
            onClick={() =>
              addToCart({
                ...product,
                title: selectedVariant?.title ? `${product.title} - ${selectedVariant.title}` : product.title,
                sku: selectedVariant?.sku || product.sku,
                image: activeImage,
                price: activePrice,
                mrp: activeMrp,
              })
            }
          >
            <ShoppingBag className="h-5 w-5" /> {inCart ? "Add One More" : "Add to Cart"}
          </Button>
          <Button size="lg" variant="outline" onClick={() => toggleWishlist(product)}>
            <Heart className="h-5 w-5" fill={wishlisted ? "currentColor" : "none"} /> {wishlisted ? "Wishlisted" : "Add to Wishlist"}
          </Button>
        </div>
        <div className="mt-8 grid gap-3 text-sm text-text-muted sm:grid-cols-3">
          <div className="rounded-lg bg-background-soft p-4"><Truck className="mb-2 h-5 w-5 text-brand-primary" />Fast shipping</div>
          <div className="rounded-lg bg-background-soft p-4"><RotateCcw className="mb-2 h-5 w-5 text-brand-primary" />Easy returns</div>
          <div className="rounded-lg bg-background-soft p-4"><ShieldCheck className="mb-2 h-5 w-5 text-brand-primary" />Secure checkout</div>
        </div>
      </div>
    </section>
  );
}

