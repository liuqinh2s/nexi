import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MdxContent } from "@/components/mdx-content";
import { SiteShell } from "@/components/site-shell";
import { absoluteUrl, getAllPages, getAllPosts, getPageBySlug } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  // Include page slugs (about, contact, etc.) so they render as content pages.
  // Also include all blog post years so output:export doesn't block the
  // /:year/:month/:day/:slug child route when year values like "2026" are accessed.
  const pageSlugs = getAllPages().map((page) => ({ year: page.slug }));
  const years = [
    ...new Set(getAllPosts().map((post) => post.date.slice(0, 4))),
  ].map((year) => ({ year }));
  return [...pageSlugs, ...years];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  const page = getPageBySlug(year);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: absoluteUrl(`/${page.slug}/`) },
  };
}

export default async function ContentPageRoute({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const page = getPageBySlug(year);
  if (!page) notFound();
  return (
    <SiteShell toc={page.toc}>
      <article className="article-panel standalone-page">
        <header className="article-header">
          <h1>{page.title}</h1>
        </header>
        <MdxContent source={page.source} />
      </article>
    </SiteShell>
  );
}
