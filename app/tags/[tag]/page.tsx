import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getPostsByTag, getTaxonomy } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTaxonomy("tags").map((tag) => ({ tag: tag.name }));
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: value } = await params;
  const name = decodeURIComponent(value);
  const posts = getPostsByTag(name);
  if (!posts.length) notFound();
  return (
    <SiteShell>
      <section className="collection-panel timeline-panel">
        <header>
          <h1>标签：{name}</h1>
          <p>共 {posts.length} 篇文章</p>
        </header>
        <div className="timeline-list">
          {posts.map((post) => (
            <Link href={post.url} key={post.url}>
              <time>{post.date}</time>
              <strong>{post.title}</strong>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
