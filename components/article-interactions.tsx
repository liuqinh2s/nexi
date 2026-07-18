"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { X } from "lucide-react";

export function ArticleInteractions({ children }: { children: ReactNode }) {
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLImageElement) || target.closest("a")) return;
    setImage({ src: target.currentSrc || target.src, alt: target.alt });
  }

  return (
    <>
      <div onClick={handleClick}>{children}</div>
      {image && (
        <div className="lightbox" onClick={() => setImage(null)} role="presentation">
          <button aria-label="关闭图片预览" onClick={() => setImage(null)} title="关闭" type="button">
            <X size={22} />
          </button>
          {/* Native img keeps remote and user-authored image URLs working in static exports. */}
          <img alt={image.alt} onClick={(event) => event.stopPropagation()} src={image.src} />
        </div>
      )}
    </>
  );
}
