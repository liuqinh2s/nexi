"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/types/content";

export function Toc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => Boolean(heading));

    function updateActiveHeading() {
      const current = headings
        .filter((heading) => heading.getBoundingClientRect().top <= 140)
        .at(-1);
      setActiveId(current?.id ?? headings[0]?.id ?? "");
    }

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveHeading);
  }, [items]);

  return (
    <nav className="toc-list" aria-label="文章目录">
      {items.map((item) => (
        <a
          className={activeId === item.id ? "current" : ""}
          href={`#${item.id}`}
          key={item.id}
          style={{ paddingLeft: `${10 + Math.max(0, item.level - 1) * 12}px` }}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
