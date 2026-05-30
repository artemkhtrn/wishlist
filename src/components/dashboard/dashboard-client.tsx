"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { GiftCard, CARD_COLORS } from "@/components/gifts/gift-card";
import { AddGiftModal } from "@/components/gifts/add-gift-modal";
import { NewOccasionForm } from "@/components/occasions/new-occasion-form";
import { ShareButton } from "@/components/occasions/share-button";
import type { Occasion, Gift } from "@/types";

type OccasionFull = Occasion & { gifts: Gift[] };

interface FollowedPerson {
  slug: string;
  userName: string;
  occasionName: string;
}

interface DashboardClientProps {
  userId: string;
  userName: string;
  initialOccasions: OccasionFull[];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function giftColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return CARD_COLORS[h % CARD_COLORS.length];
}

function parseSlug(input: string): string | null {
  try {
    const url = new URL(input);
    const match = url.pathname.match(/\/share\/([^/]+)/);
    if (match) return match[1];
  } catch {
    // not a URL — treat as slug directly
  }
  const plain = input.trim().replace(/^\/+/, "");
  if (plain && !plain.includes("/")) return plain;
  return null;
}

const STORAGE_KEY = "wishly_followed";

function loadFollowed(): FollowedPerson[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveFollowed(list: FollowedPerson[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function DashboardClient({ userName, initialOccasions }: DashboardClientProps) {
  const [occasions, setOccasions] = useState<OccasionFull[]>(initialOccasions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addGiftOpen, setAddGiftOpen] = useState(false);
  const [newOccasionOpen, setNewOccasionOpen] = useState(false);
  const [editGift, setEditGift] = useState<Gift | null>(null);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [followed, setFollowed] = useState<FollowedPerson[]>([]);

  useEffect(() => {
    setFollowed(loadFollowed());
  }, []);

  const allGifts = occasions.flatMap((o) => o.gifts);
  const filteredGifts = selectedId
    ? (occasions.find((o) => o.id === selectedId)?.gifts ?? [])
    : allGifts;

  const addGiftOccasionId =
    selectedId ?? (occasions.length === 1 ? occasions[0].id : "");

  const userInits = initials(userName);

  const onGiftSaved = (saved: Gift) => {
    setOccasions((prev) =>
      prev.map((o) => {
        if (o.id !== saved.occasionId) return o;
        const exists = o.gifts.some((g) => g.id === saved.id);
        return {
          ...o,
          gifts: exists
            ? o.gifts.map((g) => (g.id === saved.id ? saved : g))
            : [...o.gifts, saved],
        };
      })
    );
  };

  const onDelete = async (id: string, occasionId: string) => {
    if (!confirm("Delete this gift?")) return;
    const res = await fetch(`/api/gifts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setOccasions((prev) =>
        prev.map((o) =>
          o.id !== occasionId ? o : { ...o, gifts: o.gifts.filter((g) => g.id !== id) }
        )
      );
    }
  };

  const onReserve = async (id: string, status: "RESERVED" | "AVAILABLE", occasionId: string, name?: string) => {
    const res = await fetch(`/api/gifts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(name && { reservedByName: name }) }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOccasions((prev) =>
        prev.map((o) =>
          o.id !== occasionId
            ? o
            : { ...o, gifts: o.gifts.map((g) => (g.id === id ? updated : g)) }
        )
      );
    }
  };

  const onOccasionCreated = (newOccasion: Occasion) => {
    setOccasions((prev) => [{ ...newOccasion, gifts: [] }, ...prev]);
    setSelectedId(newOccasion.id);
    setNewOccasionOpen(false);
  };

  const onPersonAdded = (person: FollowedPerson) => {
    setFollowed((prev) => {
      const next = prev.some((p) => p.slug === person.slug) ? prev : [...prev, person];
      saveFollowed(next);
      return next;
    });
    setAddPersonOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7]">
      {/* ── Sidebar (desktop only) ── */}
      <aside className="hidden md:flex w-[280px] bg-white border-r border-gray-100 flex-col px-5 py-6 shrink-0">
        <div className="mb-8">
          <Image src="/wishly_logo.png" alt="Wishly" width={80} height={21} className="h-[28px] w-auto" />
          <p className="text-xs text-gray-400 mt-1">shared gift lists</p>
        </div>

        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-3">
          People
        </p>

        <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto min-h-0">
          {/* Current user */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#ede9fe]">
            <div className="w-8 h-8 rounded-full bg-[#c4b5fd] text-violet-800 text-xs font-bold flex items-center justify-center shrink-0 select-none">
              {userInits}
            </div>
            <span className="text-sm font-semibold text-violet-800 truncate">{userName}</span>
          </div>

          {/* Followed people */}
          {followed.map((p) => (
            <Link
              key={p.slug}
              href={`/share/${p.slug}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0 select-none">
                {initials(p.userName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{p.userName}</p>
                <p className="text-xs text-gray-400 truncate">{p.occasionName}</p>
              </div>
            </Link>
          ))}
        </div>

        <button
          onClick={() => setAddPersonOpen(true)}
          className="mt-5 w-full border border-gray-200 rounded-xl py-2.5 text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          + add person
        </button>
      </aside>

      {/* ── Main panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top header */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-7 py-3 md:py-4 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#c4b5fd] text-violet-800 text-sm font-bold flex items-center justify-center shrink-0 select-none">
              {userInits}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-[14px] md:text-[15px] leading-snug truncate">{userName}</p>
              <p className="text-xs text-gray-400 hidden sm:block">
                {allGifts.length} {allGifts.length === 1 ? "wish" : "wishes"} across{" "}
                {occasions.length} {occasions.length === 1 ? "occasion" : "occasions"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedId && (() => {
              const occ = occasions.find((o) => o.id === selectedId);
              return occ?.isPublic ? <ShareButton slug={occ.shareSlug} /> : null;
            })()}
            <button
              onClick={() => { setEditGift(null); setAddGiftOpen(true); }}
              className="border border-gray-200 rounded-2xl px-3 md:px-5 py-2 text-[13px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">+ add wish</span>
              <span className="sm:hidden">+ wish</span>
            </button>
          </div>
        </header>

        {/* Occasion tabs */}
        <div className="bg-white border-b border-gray-100 px-2 md:px-7 flex items-end gap-0 shrink-0 overflow-x-auto">
          {([{ id: null as null, name: "All" }] as { id: string | null; name: string }[])
            .concat(occasions)
            .map((o) => (
              <button
                key={o.id ?? "all"}
                onClick={() => setSelectedId(o.id)}
                className={`px-3 md:px-4 py-3 md:py-3.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
                  selectedId === o.id
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {o.name}
              </button>
            ))}
          <button
            onClick={() => setNewOccasionOpen(true)}
            className="px-3 md:px-4 py-3 md:py-3.5 text-[13px] text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap border-b-2 border-transparent"
          >
            + new
          </button>
        </div>

        {/* Gift grid */}
        <main className="flex-1 overflow-y-auto p-4 md:p-7">
          {filteredGifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <span className="text-5xl">🎁</span>
              {occasions.length === 0 ? (
                <p className="text-gray-400 text-sm">Create an occasion first, then add wishes.</p>
              ) : (
                <>
                  <p className="text-gray-400 text-sm">No wishes yet</p>
                  <button
                    onClick={() => { setEditGift(null); setAddGiftOpen(true); }}
                    className="border border-gray-200 rounded-2xl px-5 py-2 text-[13px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    + add wish
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredGifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  colorClass={giftColor(gift.id)}
                  isOwner={true}
                  onReserve={(id, status, name) => onReserve(id, status, gift.occasionId, name)}
                  onEdit={(g) => { setEditGift(g); setAddGiftOpen(true); }}
                  onDelete={(id) => onDelete(id, gift.occasionId)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Modals ── */}
      <AddGiftModal
        open={addGiftOpen}
        onClose={() => { setAddGiftOpen(false); setEditGift(null); }}
        occasionId={addGiftOccasionId}
        occasions={occasions.map((o) => ({ id: o.id, name: o.name }))}
        editGift={editGift}
        onSaved={onGiftSaved}
      />

      <Modal open={newOccasionOpen} onClose={() => setNewOccasionOpen(false)} title="New occasion">
        <NewOccasionForm onClose={() => setNewOccasionOpen(false)} onCreated={onOccasionCreated} />
      </Modal>

      <Modal open={addPersonOpen} onClose={() => setAddPersonOpen(false)} title="Add person">
        <AddPersonForm onAdd={onPersonAdded} onClose={() => setAddPersonOpen(false)} />
      </Modal>
    </div>
  );
}

function AddPersonForm({
  onAdd,
  onClose,
}: {
  onAdd: (person: FollowedPerson) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const slug = parseSlug(input);
    if (!slug) {
      setError("Paste a valid Wishly share link or slug.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/share/${slug}`);
      if (!res.ok) {
        setError("Wishlist not found. Check the link and try again.");
        return;
      }
      const data = await res.json();
      onAdd(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Share link</label>
        <input
          type="text"
          placeholder="https://wishly.app/share/…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400 transition-colors"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex-1 bg-violet-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Looking up…" : "Add"}
        </button>
      </div>
    </form>
  );
}
