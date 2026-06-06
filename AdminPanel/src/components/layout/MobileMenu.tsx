"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Image as ImageIcon, Menu, RotateCcw, Sparkles, Truck, UserRound, X } from "lucide-react";
import { categories } from "@/data/categories";
import { Button } from "@/components/ui/Button";

export function MobileMenuTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button className="qh-focus inline-flex h-11 w-11 shrink-0 items-center justify-center text-text-main lg:hidden md:rounded-full md:border md:border-border md:bg-background-elevated" onClick={onOpen} aria-label="Open menu">
      <Menu className="h-7 w-7 md:h-5 md:w-5" />
    </button>
  );
}

export function MobileMenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-drawer qh-scrim lg:hidden">
          <div className="flex h-full qh-panel-mobile flex-col overflow-y-auto bg-background-elevated shadow-dropdown">
            <div className="sticky top-0 z-base flex items-center justify-between border-b border-border bg-background-elevated px-5 py-5 shadow-soft">
              <Link href="/" className="text-3xl font-black tracking-normal text-text-main" onClick={onClose}>QuirkyHome</Link>
              <button className="qh-focus inline-flex h-10 w-10 items-center justify-center rounded-full" onClick={onClose} aria-label="Close menu">
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-x-4 gap-y-7 px-5 py-7">
              {categories.slice(0, 6).map((category) => (
                <Link key={category.slug} href={`/category/${category.slug}`} className="group text-center" onClick={onClose}>
                  <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-background-soft shadow-soft">
                    <Image src={category.image} alt={category.name} fill sizes="5rem" className="object-cover transition-transform duration-base group-hover:scale-105" />
                  </div>
                  <span className="mt-2 block text-sm font-semibold leading-snug text-text-main">{category.name}</span>
                </Link>
              ))}
            </div>

            <div className="px-5 pb-6">
              <Link href="/search" onClick={onClose} className="qh-focus flex h-14 items-center justify-center gap-3 rounded-lg border border-text-main bg-background-elevated text-base font-bold text-text-main">
                <ImageIcon className="h-7 w-7" /> Explore More Categories
              </Link>
            </div>

            <div className="border-y border-border bg-background-soft/70 py-4">
              <div className="flex items-center gap-4 px-6 py-3">
                <UserRound className="h-7 w-7 text-text-main" />
                <span className="flex-1 text-base font-bold text-text-main">Login / Register</span>
                <Link href="/account" onClick={onClose}>
                  <Button size="sm" className="bg-brand-accent text-text-main hover:bg-brand-accent">Sign In</Button>
                </Link>
              </div>
            </div>

            <div className="grid bg-background-elevated">
              <Link href="/search" onClick={onClose} className="flex items-center gap-4 border-b border-border px-6 py-5 text-base font-bold text-text-main">
                <Sparkles className="h-6 w-6" />
                <span className="flex-1">Quirky Vibe - Find The Look</span>
                <span className="rounded-lg bg-brand-accent px-4 py-1 text-sm font-bold text-text-main">NEW</span>
                <ChevronRight className="h-6 w-6" />
              </Link>
              <Link href="/account" onClick={onClose} className="flex items-center gap-4 border-b border-border px-6 py-5 text-base font-bold text-text-main">
                <Truck className="h-6 w-6" />
                <span className="flex-1">Track Your Order</span>
                <ChevronRight className="h-6 w-6" />
              </Link>
              <Link href="/account" onClick={onClose} className="flex items-center gap-4 px-6 py-5 text-base font-bold text-text-main">
                <RotateCcw className="h-6 w-6" />
                <span className="flex-1">Return / Exchange</span>
                <ChevronRight className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

