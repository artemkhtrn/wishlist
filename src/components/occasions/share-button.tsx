"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export function ShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = `${window.location.origin}/share/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-medium border border-violet-200 rounded-xl px-3 py-1.5 hover:bg-violet-50 transition-colors"
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
