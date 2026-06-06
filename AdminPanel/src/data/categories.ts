export type Category = {
  name: string;
  slug: string;
  image: string;
  description: string;
};

export const categories: Category[] = [
  { name: "Bedding", slug: "bedding", image: "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=80", description: "Layered sheets, dohars, quilts, and cushion stories." },
  { name: "Furnishing", slug: "furnishing", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80", description: "Soft furnishings, curtains, and upholstered pieces." },
  { name: "Organiser", slug: "organiser", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80", description: "Storage solutions, organizers, and decluttering essentials." },
  { name: "Bath Gifts", slug: "bath-gifts", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80", description: "Bath accessories, towels, and spa-like home accents." },
  { name: "New Arrival", slug: "new-arrival", image: "https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=900&q=80", description: "Latest additions to our curated home decor collection." },
  { name: "Comforters", slug: "comforters", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80", description: "Cozy quilts, duvets, and layered comfort essentials." },
  { name: "Carpet", slug: "carpet", image: "https://images.unsplash.com/photo-1582888313635-7636b2597202?auto=format&fit=crop&w=900&q=80", description: "Soft carpets, rugs, and floor coverings for every room." },
  { name: "Return and Exchange", slug: "return-and-exchange", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80", description: "Easy returns, exchanges, and hassle-free policy information." },
];

export const searchChips = ["Bedsheets", "Artificial Plants", "Photo Frames", "Wall Clocks", "Canvas Paintings", "Table Lamps", "Cushion Covers"];
