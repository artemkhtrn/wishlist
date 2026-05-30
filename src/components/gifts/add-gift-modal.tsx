"use client";

import { useState, useRef, useEffect } from "react";
import { Link2, Loader2, Upload } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { Gift } from "@/types";

interface AddGiftModalProps {
  open: boolean;
  onClose: () => void;
  occasionId: string;
  occasions?: { id: string; name: string }[];
  editGift?: Gift | null;
  onSaved: (gift: Gift) => void;
}

const EMPTY_FORM = {
  title: "",
  price: "",
  currency: "EUR",
  shopUrl: "",
  imageUrl: "",
  notes: "",
  priority: "0",
};

export function AddGiftModal({ open, onClose, occasionId, occasions, editGift, onSaved }: AddGiftModalProps) {
  const [selectedOccasionId, setSelectedOccasionId] = useState(occasionId);
  const [form, setForm] = useState(
    editGift
      ? {
          title: editGift.title,
          price: editGift.price?.toString() ?? "",
          currency: editGift.currency,
          shopUrl: editGift.shopUrl ?? "",
          imageUrl: editGift.imageUrl ?? "",
          notes: editGift.notes ?? "",
          priority: editGift.priority.toString(),
        }
      : EMPTY_FORM
  );
  const [scraping, setScraping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedOccasionId(occasionId);
      setForm(
        editGift
          ? {
              title: editGift.title,
              price: editGift.price?.toString() ?? "",
              currency: editGift.currency,
              shopUrl: editGift.shopUrl ?? "",
              imageUrl: editGift.imageUrl ?? "",
              notes: editGift.notes ?? "",
              priority: editGift.priority.toString(),
            }
          : EMPTY_FORM
      );
    }
  }, [open, occasionId, editGift]);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const scrapeUrl = async () => {
    if (!form.shopUrl) return;
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.shopUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({
          ...f,
          title: f.title || data.title || f.title,
          price: f.price || data.price || f.price,
          imageUrl: f.imageUrl || data.imageUrl || f.imageUrl,
          notes: f.notes || data.description || f.notes,
        }));
      }
    } finally {
      setScraping(false);
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        set("imageUrl", url);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOccasionId) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        occasionId: selectedOccasionId,
        price: form.price || null,
        priority: parseInt(form.priority),
      };
      const url = editGift ? `/api/gifts/${editGift.id}` : "/api/gifts";
      const method = editGift ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      onSaved(saved);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const showOccasionPicker = !editGift && occasions && occasions.length > 1 && !occasionId;

  return (
    <Modal open={open} onClose={onClose} title={editGift ? "Edit wish" : "Add a wish"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Occasion picker — only when "All" tab is active and there are multiple occasions */}
        {showOccasionPicker && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Occasion</label>
            <select
              required
              value={selectedOccasionId}
              onChange={(e) => setSelectedOccasionId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select an occasion…</option>
              {occasions!.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* No occasions at all */}
        {occasions && occasions.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Create an occasion first before adding a wish.
          </p>
        )}

        {(occasions === undefined || occasions.length > 0) && (
          <>
            {/* URL scraper */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://amazon.com/…"
                  value={form.shopUrl}
                  onChange={(e) => set("shopUrl", e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={scrapeUrl}
                  disabled={scraping || !form.shopUrl}
                >
                  {scraping ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                  {scraping ? "Fetching…" : "Auto-fill"}
                </Button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gift name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sony WH-1000XM5"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Price + currency */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {["EUR", "USD", "GBP", "JPY", "CAD", "AUD"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt="preview"
                  className="h-24 w-24 object-cover rounded-xl mb-2 border border-gray-100"
                />
              )}
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://… or upload"
                  value={form.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="Color, size, preference…"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>

            {/* Priority */}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.priority === "1"}
                onChange={(e) => set("priority", e.target.checked ? "1" : "0")}
                className="rounded accent-violet-600"
              />
              Mark as high priority ⭐
            </label>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Saving…" : editGift ? "Save changes" : "Add wish"}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
