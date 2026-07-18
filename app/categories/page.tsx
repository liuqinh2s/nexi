import type { Metadata } from "next";
import Link from "next/link";
import { Folder } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { getTaxonomy } from "@/lib/content";

export const metadata: Metadata = { title: "分类", description: "按分类浏览博客文章。" };

export default function CategoriesPage() {
  const categories = getTaxonomy("categories");
  return (
    <SiteShell>
      <section className="collection-panel">
        <header>
          <h1>分类</h1>
          <p>目前共有 {categories.length} 个分类</p>
        </header>
        <div className="category-list">
          {categories.map((category) => (
            <Link href={`/categories/${encodeURIComponent(category.name)}/`} key={category.name}>
              <Folder size={17} />
              <strong>{category.name}</strong>
              <span>{category.count} 篇</span>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
