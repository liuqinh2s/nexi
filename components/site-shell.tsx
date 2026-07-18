import type { ReactNode } from "react";
import { BackToTop } from "@/components/back-to-top";
import { Sidebar } from "@/components/sidebar";
import { siteConfig } from "@/config/site";
import { getSearchRecords, getSiteStats } from "@/lib/content";
import type { TocItem } from "@/types/content";

function Snowfall() {
  if (!siteConfig.features.snowfall) return null;
  return (
    <div className="snowfall" aria-hidden="true">
      {Array.from({ length: 36 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

export function SiteShell({ children, toc }: { children: ReactNode; toc?: TocItem[] }) {
  const stats = getSiteStats();
  const searchRecords = getSearchRecords();
  const years = new Date().getFullYear() - Number(siteConfig.since.slice(0, 4));

  return (
    <div className="page-shell">
      <Snowfall />
      <Sidebar searchRecords={searchRecords} stats={stats} toc={toc} />
      <div className="content-column">
        {children}
        <footer className="site-footer">
          <p>
            © {new Date().getFullYear()} {siteConfig.author.name} · {stats.words.toLocaleString("zh-CN")} 字
          </p>
          <p>本站已运行约 {Math.max(1, years)} 年 · Powered by Next.js</p>
        </footer>
      </div>
      <BackToTop />
    </div>
  );
}
