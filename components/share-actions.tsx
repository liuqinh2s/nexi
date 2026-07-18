"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

export function ShareActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      await navigator.share({ title, url: window.location.href });
      return;
    }
    await copyLink();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="share-actions">
      <button onClick={share} type="button">
        <Share2 size={15} />
        分享文章
      </button>
      <button onClick={copyLink} type="button">
        {copied ? <Check size={15} /> : <Link2 size={15} />}
        {copied ? "已复制" : "复制链接"}
      </button>
    </div>
  );
}
