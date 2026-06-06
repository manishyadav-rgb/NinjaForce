export type Collection = {
  title: string;
  slug: string;
  description: string;
  image: string;
};

export const collections: Collection[] = [
  { title: "The Wall Edit", slug: "wall-edit", description: "Art, clocks, frames, and mirrors for homes with stories.", image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80" },
  { title: "Cozy Bedroom Picks", slug: "cozy-bedroom-picks", description: "Layered cotton, calm lighting, and cushions with character.", image: "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=80" },
  { title: "Quirky Corners", slug: "quirky-corners", description: "Small accents that give forgotten corners a little wink.", image: "https://images.unsplash.com/photo-1602872030490-4a484a7b3ba6?auto=format&fit=crop&w=900&q=80" },
  { title: "Dinner Table Stories", slug: "dinner-table-stories", description: "Serveware and linens for meals that linger longer.", image: "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80" },
];
