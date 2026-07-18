import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { getAllPosts } from "@/lib/content";

export const metadata: Metadata = { title: "归档", description: "博客文章时间归档。" };

export default function ArchivesPage() {
  const posts = getAllPosts();
  const groups = Map.groupBy(posts, (post) => post.date.slice(0, 4));

  return (
    <SiteShell>
      <section className="collection-panel timeline-panel">
        <header>
          <h1>归档</h1>
          <p>目前共有 {posts.length} 篇文章，继续写下去。</p>
        </header>
        {[...groups.entries()].map(([year, items]) => (
          <section className="archive-year" key={year}>
            <h2>{year}</h2>
            <div className="timeline-list">
              {items.map((post) => (
                <Link href={post.url} key={post.url}>
                  <time>{post.date.slice(5)}</time>
                  <strong>{post.title}</strong>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </section>
    </SiteShell>
  );
}
