import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { Comments } from "@/components/comments";
import { MdxContent } from "@/components/mdx-content";
import { PostMeta } from "@/components/post-meta";
import { ShareActions } from "@/components/share-actions";
import { SiteShell } from "@/components/site-shell";
import { siteConfig } from "@/config/site";
import { absoluteUrl, getAdjacentPosts, getAllPosts, getPostByRoute } from "@/lib/content";

type RouteParams = { year: string; month: string; day: string; slug: string };

export function generateStaticParams() {
  return getAllPosts().map((post) => {
    const [year, month, day] = post.date.split("-");
    return { year, month, day, slug: post.slug };
  });
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const values = await params;
  const post = getPostByRoute(values.year, values.month, values.day, values.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: absoluteUrl(post.url) },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: absoluteUrl(post.url),
      publishedTime: post.date,
      modifiedTime: post.updated,
      tags: post.tags,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<RouteParams> }) {
  const values = await params;
  const post = getPostByRoute(values.year, values.month, values.day, values.slug);
  if (!post) notFound();
  const { newer, older } = getAdjacentPosts(post);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    description: post.description,
    author: { "@type": "Person", name: siteConfig.author.name },
    mainEntityOfPage: absoluteUrl(post.url),
  };

  return (
    <SiteShell toc={post.toc}>
      <article className="article-panel">
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
          type="application/ld+json"
        />
        <header className="article-header">
          <h1>{post.title}</h1>
          <PostMeta post={post} />
        </header>
        <MdxContent format={post.format} source={post.source} />
        {post.tags.length > 0 && (
          <footer className="post-tags">
            <Tag size={15} />
            {post.tags.map((tag) => (
              <Link href={`/tags/${encodeURIComponent(tag)}/`} key={tag}>
                #{tag}
              </Link>
            ))}
          </footer>
        )}
        <ShareActions title={post.title} />
        <nav aria-label="相邻文章" className="post-navigation">
          {newer ? (
            <Link href={newer.url}>
              <ChevronLeft size={18} />
              <span>
                <small>较新文章</small>
                {newer.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {older ? (
            <Link href={older.url}>
              <span>
                <small>较早文章</small>
                {older.title}
              </span>
              <ChevronRight size={18} />
            </Link>
          ) : (
            <span />
          )}
        </nav>
        {post.comments && <Comments />}
      </article>
    </SiteShell>
  );
}
