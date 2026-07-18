import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageUrl(page: number) {
  return page === 1 ? "/" : `/page/${page}/`;
}

// Returns page numbers with "..." inserted at gaps
function getPageItems(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const delta = 2; // 当前页左右各显示几个页码
  const rangeSet = new Set<number>();
  rangeSet.add(1);
  rangeSet.add(total);
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    rangeSet.add(i);
  }

  const sorted = Array.from(rangeSet).sort((a, b) => a - b);
  const items: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      items.push("...");
    }
    items.push(sorted[i]);
  }
  return items;
}

export function Pagination({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null;

  const items = getPageItems(current, total);

  return (
    <nav aria-label="文章分页" className="pagination">
      {current > 1 ? (
        <Link aria-label="上一页" href={pageUrl(current - 1)} title="上一页">
          <ChevronLeft size={17} />
        </Link>
      ) : (
        <span />
      )}
      <div>
        {items.map((item, index) =>
          item === "..." ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
              …
            </span>
          ) : (
            <Link
              className={item === current ? "current" : ""}
              href={pageUrl(item)}
              key={item}
            >
              {item}
            </Link>
          )
        )}
      </div>
      {current < total ? (
        <Link aria-label="下一页" href={pageUrl(current + 1)} title="下一页">
          <ChevronRight size={17} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
