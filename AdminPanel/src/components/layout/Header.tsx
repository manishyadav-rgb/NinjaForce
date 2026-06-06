"use client";

import Link from "next/link";
import { Heart, ShoppingBag, UserRound, Home, Search } from "lucide-react";
import { useState } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { useShop } from "@/components/shop/ShopProvider";
import { MobileMenuDrawer, MobileMenuTrigger } from "./MobileMenu";
import { AnnouncementBar } from "./AnnouncementBar";
import { CategoryNav } from "./CategoryNav";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount, wishlistCount } = useShop();
  const actions = [
    { href: "/wishlist", label: "Wishlist", icon: Heart, count: wishlistCount },
    { href: "/cart", label: "Cart", icon: ShoppingBag, count: cartCount },
    { href: "/account", label: "Account", icon: UserRound },
  ];

  return (
    <>
      <div className="sticky top-0 z-header">
        <AnnouncementBar />
        <header className="border-b border-border qh-header-surface backdrop-blur">
          <div className="qh-mobile-header md:hidden">
            <MobileMenuTrigger onOpen={() => setMenuOpen(true)} />
            <SearchBar compact withCamera placeholder="Search for Photo frames" className="min-w-0 flex-1" />
            <Link href="/cart" className="qh-focus relative inline-flex h-11 w-11 shrink-0 items-center justify-center text-text-main" aria-label="Cart">
              <ShoppingBag className="h-7 w-7" />
              {cartCount ? <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-text-main px-1 text-[11px] font-bold text-text-inverse">{cartCount}</span> : null}
            </Link>
          </div>
          <div className="qh-container hidden h-header items-center gap-4 md:flex">
            <MobileMenuTrigger onOpen={() => setMenuOpen(true)} />
            <Link href="/" className="qh-logo shrink-0 text-2xl md:text-3xl">QuirkyHome</Link>
            <SearchBar className="qh-header-search hidden md:block" />
            <div className="ml-auto hidden items-center gap-2 md:flex">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href} className="qh-focus relative inline-flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-all duration-base hover:bg-background-soft hover:text-brand-primary" aria-label={action.label}>
                    <Icon className="h-5 w-5" />
                    {action.count ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-primary px-1 text-[11px] font-bold text-text-inverse">{action.count}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
          <CategoryNav />
        </header>
      </div>

      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

