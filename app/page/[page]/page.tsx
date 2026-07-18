import { notFound } from "next/navigation";
import { Pagination } from "@/components/pagination";
import { PostList } from "@/components/post-list";
import { SiteShell } from "@/components/site-shell";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  const total = Math.ceil(getAllPosts().length / siteConfig.postsPerPage);
  return Array.from({ length: Math.max(0, total - 1) }, (_, index) => ({ page: String(index + 2) }));
}

export default async function PaginatedHome({ params }: { params: Promise<{ page: string }> }) {
  const { page: value } = await params;
  const page = Number(value);
  const posts = getAllPosts();
  const totalPages = Math.ceil(posts.length / siteConfig.postsPerPage);
  if (!Number.isInteger(page) || page < 2 || page > totalPages) notFound();
  const start = (page - 1) * siteConfig.postsPerPage;

  return (
    <SiteShell>
      <PostList posts={posts.slice(start, start + siteConfig.postsPerPage)} />
      <Pagination current={page} total={totalPages} />
    </SiteShell>
  );
}
