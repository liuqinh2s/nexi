"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { SearchRecord } from "@/types/content";

export function SearchDialog({
  open,
  records,
  onClose,
}: {
  open: boolean;
  records: SearchRecord[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => inputRef.current?.focus(), 30);

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];

    return records
      .map((record) => {
        const title = record.title.toLowerCase();
        const haystack = [record.description, record.text, record.tags.join(" "), record.categories.join(" ")]
          .join(" ")
          .toLowerCase();
        const score = words.reduce(
          (total, word) => total + (title.includes(word) ? 8 : 0) + (haystack.includes(word) ? 1 : 0),
          0,
        );
        return { record, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }, [query, records]);

  if (!open) return null;

  return (
    <div className="search-overlay" onMouseDown={onClose} role="presentation">
      <section
        aria-label="站内搜索"
        aria-modal="true"
        className="search-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header>
          <Search size={19} />
          <input
            aria-label="搜索文章"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索文章、标签或正文..."
            ref={inputRef}
            type="search"
            value={query}
          />
          <button aria-label="关闭搜索" onClick={onClose} title="关闭" type="button">
            <X size={20} />
          </button>
        </header>
        <div className="search-results">
          {!query.trim() && <p className="search-state">输入关键词开始搜索</p>}
          {query.trim() && results.length === 0 && <p className="search-state">没有找到相关文章</p>}
          {results.map(({ record }) => (
            <Link href={record.url} key={record.url} onClick={onClose}>
              <strong>{record.title}</strong>
              <span>{record.description}</span>
              {(record.tags.length > 0 || record.categories.length > 0) && (
                <small>{[...record.categories, ...record.tags].join(" · ")}</small>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
