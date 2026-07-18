"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Archive,
  Compass,
  Edit3,
  Github,
  Grid3X3,
  Home,
  Link2,
  Menu,
  MessageCircle,
  Rss,
  Search,
  Tag,
  User,
  X,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import type { SearchRecord, TocItem } from "@/types/content";
import { SearchDialog } from "@/components/search-dialog";
import { Toc } from "@/components/toc";

const icons = {
  home: Home,
  user: User,
  tag: Tag,
  categories: Grid3X3,
  archive: Archive,
  edit: Edit3,
  compass: Compass,
  github: Github,
  twitter: MessageCircle,
  rss: Rss,
};

export function Sidebar({
  stats,
  toc = [],
  searchRecords,
}: {
  stats: { posts: number; tags: number; categories: number };
  toc?: TocItem[];
  searchRecords: SearchRecord[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/page/");
    return pathname.startsWith(href.replace(/\/$/, ""));
  }

  return (
    <>
      <div className="mobile-header">
        <Link href="/">
          <strong>{siteConfig.shortTitle}</strong>
          <span>{siteConfig.title}</span>
        </Link>
        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "关闭导航" : "打开导航"}
          onClick={() => setMenuOpen((value) => !value)}
          title={menuOpen ? "关闭导航" : "打开导航"}
          type="button"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <Link className="brand-panel" href="/">
          <span className="site-title">{siteConfig.shortTitle}</span>
          <span className="site-subtitle">{siteConfig.title}</span>
        </Link>

        <nav className="menu-panel" aria-label="主导航">
          {siteConfig.navigation.map((item) => {
            const Icon = icons[item.icon];
            return (
              <Link
                className={isActive(item.href) ? "menu-item active" : "menu-item"}
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={15} strokeWidth={2.2} />
                <span>{item.label}</span>
                {isActive(item.href) && <i />}
              </Link>
            );
          })}
          <button className="menu-item" onClick={() => setSearchOpen(true)} type="button">
            <Search size={15} strokeWidth={2.2} />
            <span>搜索</span>
          </button>
        </nav>

        <section className="author-panel">
          {/* Native img allows a template user to configure any static or remote avatar URL. */}
          <img alt={siteConfig.author.name} className="avatar" src={siteConfig.author.avatar} />
          <h2>{siteConfig.author.name}</h2>
          <p>{siteConfig.author.bio}</p>
          <div className="stats">
            <Link href="/archives/">
              <strong>{stats.posts}</strong>
              <span>日志</span>
            </Link>
            <Link href="/categories/">
              <strong>{stats.categories}</strong>
              <span>分类</span>
            </Link>
            <Link href="/tags/">
              <strong>{stats.tags}</strong>
              <span>标签</span>
            </Link>
          </div>
          <div className="social-grid">
            {siteConfig.social.map((item) => {
              const Icon = icons[item.icon];
              const external = item.href.startsWith("http");
              const content = (
                <>
                  <Icon size={15} />
                  <span>{item.label}</span>
                </>
              );
              return external ? (
                <a
                  href={item.href}
                  key={item.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {content}
                </a>
              ) : (
                <Link href={item.href} key={item.href}>
                  {content}
                </Link>
              );
            })}
          </div>
        </section>

        {toc.length > 0 && (
          <section className="toc-panel">
            <h3>文章目录</h3>
            <Toc items={toc} />
          </section>
        )}

        <section className="blogroll-panel">
          <h3>
            <Link2 size={14} />
            Links
          </h3>
          {siteConfig.blogroll.map((item) => (
            <a href={item.href} key={item.href} rel="noreferrer" target="_blank">
              {item.label}
            </a>
          ))}
        </section>
      </aside>

      <SearchDialog onClose={closeSearch} open={searchOpen} records={searchRecords} />
    </>
  );
}
