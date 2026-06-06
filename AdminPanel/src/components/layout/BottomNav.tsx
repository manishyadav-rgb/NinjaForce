"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, ShoppingBag, UserRound } from "lucide-react";
import { useShop } from "@/components/shop/ShopProvider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/wishlist", label: "Wishlist", icon: Heart, badgeKey: "wishlistCount" as const },
  { href: "/cart", label: "Cart", icon: ShoppingBag, badgeKey: "cartCount" as const },
  { href: "/account", label: "Account", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount, wishlistCount } = useShop();

  const badges: Record<string, number> = { cartCount, wishlistCount };

  // Hide on admin/builder pages
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/");
  if (isAdmin) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background-elevated/95 backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-semibold transition-colors",
                isActive
                  ? "text-brand-primary"
                  : "text-text-muted active:text-text-main",
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] transition-transform duration-200",
                    isActive && "scale-110",
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {badge > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-primary px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className="mt-0.5">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-brand-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
