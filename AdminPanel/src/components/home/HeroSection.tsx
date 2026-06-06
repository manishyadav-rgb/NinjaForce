"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function HeroSection() {
  return (
    <section className="bg-background-elevated">
      <div className="qh-container grid gap-6 py-6 md:qh-hero-grid md:py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col justify-center">
          <Badge variant="accent" className="mb-5 w-fit"><Sparkles className="mr-2 h-4 w-4" /> Festive Home Refresh Sale</Badge>
          <h1 className="font-display text-4xl font-black leading-tight text-text-main md:text-5xl">Buy Home Decor Items Online for Every Indian Home</h1>
          <p className="mt-5 max-w-narrow text-lg leading-relaxed text-text-muted text-pretty">Shop bedsheets, wall decor, table lamps, kitchen essentials, dining pieces, planters, gifts, and curated home accessories at friendly prices.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/category/wall-decor" size="lg">Shop the Sale</ButtonLink>
            <ButtonLink href="/search" size="lg" variant="outline">Explore Collections</ButtonLink>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 text-sm font-bold text-text-main">
            <div className="flex items-center gap-2"><Truck className="h-5 w-5" /> Fast delivery</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Secure checkout</div>
            <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Curated picks</div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.1 }} className="relative qh-hero-media overflow-hidden rounded-lg bg-background-soft">
          <Image src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80" alt="Warm Indian inspired living room decor" fill priority sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
          <div className="absolute bottom-5 left-5 rounded-lg border border-border bg-background-elevated p-4 shadow-dropdown">
            <p className="text-sm font-bold text-brand-primary">Up to 60% Off</p>
            <p className="text-sm text-text-muted">Bedding, lamps, wall art and more</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

