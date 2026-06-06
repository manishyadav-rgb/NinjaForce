import type { MetadataRoute } from "next";
import { categories } from "@/data/categories";
import { products } from "@/data/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://quirkyhome.in";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/cart`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/wishlist`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    ...categories.map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
  ];
}
