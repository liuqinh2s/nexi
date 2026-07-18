import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { getTaxonomy } from "@/lib/content";

export const metadata: Metadata = { title: "标签", description: "按标签浏览博客文章。" };

export default function TagsPage() {
  const tags = getTaxonomy("tags");
  return (
    <SiteShell>
      <section className="collection-panel">
        <header>
          <h1>标签</h1>
          <p>目前共有 {tags.length} 个标签</p>
        </header>
        <div className="tag-cloud">
          {tags.map((tag) => (
            <Link href={`/tags/${encodeURIComponent(tag.name)}/`} key={tag.name}>
              {tag.name} <span>{tag.count}</span>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
