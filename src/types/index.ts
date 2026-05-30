export type OccasionType = "BIRTHDAY" | "CHRISTMAS" | "WEDDING" | "BABY_SHOWER" | "ANNIVERSARY" | "GRADUATION" | "CUSTOM";
export type GiftStatus = "AVAILABLE" | "RESERVED" | "PURCHASED";

export interface Gift {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  shopUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
  priority: number;
  status: GiftStatus;
  reservedBy: string | null;
  reservedByName: string | null;
  occasionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Occasion {
  id: string;
  name: string;
  type: OccasionType;
  date: Date | null;
  isPublic: boolean;
  shareSlug: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OccasionWithGifts = Occasion & { gifts: Gift[]; _count: { gifts: number } };
export type GiftWithOccasion = Gift & { occasion: Occasion };

export interface ScrapeResult {
  title?: string;
  price?: string;
  imageUrl?: string;
  description?: string;
}
