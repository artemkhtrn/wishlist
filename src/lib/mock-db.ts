// In-memory store — replaces Prisma during local dev (no DB required)
// State survives hot-reload via globalThis

interface User { id: string; name: string | null; email: string; imageUrl: string | null }
interface Occasion {
  id: string; name: string; type: string; date: Date | null;
  isPublic: boolean; shareSlug: string; userId: string;
  createdAt: Date; updatedAt: Date;
}
interface Gift {
  id: string; title: string; price: number | null; currency: string;
  shopUrl: string | null; imageUrl: string | null; notes: string | null;
  priority: number; status: string; reservedBy: string | null;
  occasionId: string; createdAt: Date; updatedAt: Date;
}

declare global {
  // eslint-disable-next-line no-var
  var __mockUsers: User[] | undefined;
  // eslint-disable-next-line no-var
  var __mockOccasions: Occasion[] | undefined;
  // eslint-disable-next-line no-var
  var __mockGifts: Gift[] | undefined;
}

const users: User[] = (globalThis.__mockUsers ??= [
  { id: "dev-user", name: "Dev User", email: "dev@example.com", imageUrl: null },
]);
const occasions: Occasion[] = (globalThis.__mockOccasions ??= []);
const gifts: Gift[] = (globalThis.__mockGifts ??= []);

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

function applyOccasionIncludes(o: Occasion, include?: Record<string, unknown>) {
  if (!include) return o;
  const extra: Record<string, unknown> = {};
  if (include.gifts) {
    let gs = gifts.filter((g) => g.occasionId === o.id);
    gs = gs.sort((a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime());
    extra.gifts = gs;
  }
  if (include.user) {
    extra.user = users.find((u) => u.id === o.userId) ?? null;
  }
  if (include._count) {
    extra._count = { gifts: gifts.filter((g) => g.occasionId === o.id).length };
  }
  return { ...o, ...extra };
}

export const db = {
  occasion: {
    findMany(args: { where?: { userId?: string }; include?: Record<string, unknown> }) {
      let result = [...occasions];
      if (args.where?.userId) result = result.filter((o) => o.userId === args.where!.userId);
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return result.map((o) => applyOccasionIncludes(o, args.include));
    },

    findUnique(args: { where: { id?: string; shareSlug?: string }; include?: Record<string, unknown> }) {
      const o = occasions.find(
        (o) =>
          (args.where.id && o.id === args.where.id) ||
          (args.where.shareSlug && o.shareSlug === args.where.shareSlug)
      );
      if (!o) return null;
      return applyOccasionIncludes(o, args.include);
    },

    create(args: { data: Omit<Partial<Occasion>, "id" | "shareSlug" | "createdAt" | "updatedAt"> & { name: string; userId: string } }) {
      const now = new Date();
      const o: Occasion = {
        id: uid(),
        name: args.data.name,
        type: args.data.type ?? "CUSTOM",
        date: args.data.date ?? null,
        isPublic: args.data.isPublic ?? true,
        shareSlug: uid(),
        userId: args.data.userId,
        createdAt: now,
        updatedAt: now,
      };
      occasions.push(o);
      return o;
    },

    update(args: { where: { id: string }; data: Partial<Occasion> }) {
      const idx = occasions.findIndex((o) => o.id === args.where.id);
      if (idx === -1) return null;
      occasions[idx] = { ...occasions[idx], ...args.data, updatedAt: new Date() };
      return occasions[idx];
    },

    delete(args: { where: { id: string } }) {
      const idx = occasions.findIndex((o) => o.id === args.where.id);
      if (idx === -1) return;
      const [removed] = occasions.splice(idx, 1);
      const toRemove = gifts.filter((g) => g.occasionId === removed.id).map((g) => g.id);
      toRemove.forEach((gid) => {
        const i = gifts.findIndex((g) => g.id === gid);
        if (i !== -1) gifts.splice(i, 1);
      });
    },
  },

  gift: {
    findUnique(args: { where: { id: string }; include?: Record<string, unknown> }) {
      const g = gifts.find((g) => g.id === args.where.id);
      if (!g) return null;
      const extra: Record<string, unknown> = {};
      if (args.include?.occasion) {
        extra.occasion = occasions.find((o) => o.id === g.occasionId) ?? null;
      }
      return { ...g, ...extra };
    },

    create(args: { data: Omit<Partial<Gift>, "id" | "status" | "reservedBy" | "createdAt" | "updatedAt"> & { title: string; occasionId: string } }) {
      const now = new Date();
      const g: Gift = {
        id: uid(),
        title: args.data.title,
        price: args.data.price ?? null,
        currency: args.data.currency ?? "USD",
        shopUrl: args.data.shopUrl ?? null,
        imageUrl: args.data.imageUrl ?? null,
        notes: args.data.notes ?? null,
        priority: args.data.priority ?? 0,
        status: "AVAILABLE",
        reservedBy: null,
        occasionId: args.data.occasionId,
        createdAt: now,
        updatedAt: now,
      };
      gifts.push(g);
      return g;
    },

    update(args: { where: { id: string }; data: Partial<Gift> }) {
      const idx = gifts.findIndex((g) => g.id === args.where.id);
      if (idx === -1) return null;
      gifts[idx] = { ...gifts[idx], ...args.data, updatedAt: new Date() };
      return gifts[idx];
    },

    delete(args: { where: { id: string } }) {
      const idx = gifts.findIndex((g) => g.id === args.where.id);
      if (idx !== -1) gifts.splice(idx, 1);
    },
  },
};
