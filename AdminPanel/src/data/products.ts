export type ProductVariant = {
  id: string;
  sku?: string;
  title?: string;
  attributes?: Record<string, unknown>;
  mrp: number;
  salePrice: number;
  image?: string;
  stock?: number;
  linkedProductSlug?: string;
};

export type Product = {
  title: string;
  slug: string;
  category: string;
  sku?: string;
  collection?: string;
  stock?: number;
  image: string;
  gallery: string[];
  rating: number;
  reviews: number;
  price: number;
  mrp: number;
  badge: string;
  description: string;
  variants?: ProductVariant[];
};

export const products: Product[] = [
  {
    title: "Marigold Block Print Bedsheet Set",
    slug: "marigold-block-print-bedsheet-set",
    category: "bedding",
    image: "https://images.unsplash.com/photo-1629949009765-40fc74d2d8dc?auto=format&fit=crop&w=900&q=80",
    gallery: ["https://images.unsplash.com/photo-1629949009765-40fc74d2d8dc?auto=format&fit=crop&w=900&q=80", "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=80"],
    rating: 4.8,
    reviews: 128,
    price: 1499,
    mrp: 2499,
    badge: "Bestseller",
    description: "A breathable cotton bedsheet set with joyful hand-block inspired motifs and a soft festive warmth.",
  },
  {
    title: "Sage Ceramic Table Lamp",
    slug: "sage-ceramic-table-lamp",
    category: "lighting",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    gallery: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80", "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80"],
    rating: 4.7,
    reviews: 74,
    price: 1899,
    mrp: 2999,
    badge: "New",
    description: "A sculptural ceramic lamp that gives bedrooms and reading corners a calm, golden glow.",
  },
  {
    title: "Mango Wood Spice Tray",
    slug: "mango-wood-spice-tray",
    category: "kitchen",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80",
    gallery: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80", "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80"],
    rating: 4.6,
    reviews: 92,
    price: 899,
    mrp: 1499,
    badge: "Sale",
    description: "A warm mango wood tray for masalas, chutneys, candles, or the tiny treasures kitchens collect.",
  },
  {
    title: "Jaipur Window Canvas Art",
    slug: "jaipur-window-canvas-art",
    category: "wall-decor",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80",
    gallery: ["https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80", "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80"],
    rating: 4.9,
    reviews: 156,
    price: 1299,
    mrp: 2199,
    badge: "Limited",
    description: "Architectural color, arched-window drama, and gallery-wall polish in one easy statement piece.",
  },
  {
    title: "Brass Bloom Votive Set",
    slug: "brass-bloom-votive-set",
    category: "gifts",
    image: "https://images.unsplash.com/photo-1604014238170-4def1e4e6fcf?auto=format&fit=crop&w=900&q=80",
    gallery: ["https://images.unsplash.com/photo-1604014238170-4def1e4e6fcf?auto=format&fit=crop&w=900&q=80", "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=80"],
    rating: 4.8,
    reviews: 63,
    price: 799,
    mrp: 1299,
    badge: "Gift Pick",
    description: "Petal-edged votives with a mellow metallic finish for pooja corners, tables, and gifting hampers.",
  },
  {
    title: "Terracotta Planter Duo",
    slug: "terracotta-planter-duo",
    category: "garden",
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80",
    gallery: ["https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80", "https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&w=900&q=80"],
    rating: 4.5,
    reviews: 47,
    price: 999,
    mrp: 1699,
    badge: "Fresh Drop",
    description: "Two earthy planters that make balconies, window ledges, and entry corners feel instantly loved.",
  },
  {
    title: "Indigo Cushion Cover Pair",
    slug: "indigo-cushion-cover-pair",
    category: "bedding",
    image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=900&q=80",
    gallery: ["https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=900&q=80", "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=80"],
    rating: 4.7,
    reviews: 111,
    price: 699,
    mrp: 1199,
    badge: "Hot Deal",
    description: "Graphic indigo cushions for sofas and beds that need a crisp, handcrafted accent.",
  },
  {
    title: "Wicker Storage Basket",
    slug: "wicker-storage-basket",
    category: "storage",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80",
    gallery: ["https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80", "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=900&q=80"],
    rating: 4.6,
    reviews: 85,
    price: 1099,
    mrp: 1799,
    badge: "Organize",
    description: "A soft-edged wicker basket for throws, toys, laundry, or the mysterious chair pile.",
  },
];

export const formatPrice = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export const discountFor = (price: number, mrp: number) => Math.round(((mrp - price) / mrp) * 100);
