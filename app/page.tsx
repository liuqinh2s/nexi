import { Pagination } from "@/components/pagination";
import { PostList } from "@/components/post-list";
import { SiteShell } from "@/components/site-shell";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/content";

export default function HomePage() {
  const posts = getAllPosts();
  const totalPages = Math.ceil(posts.length / siteConfig.postsPerPage);

  return (
    <SiteShell>
      <PostList posts={posts.slice(0, siteConfig.postsPerPage)} />
      <Pagination current={1} total={totalPages} />
    </SiteShell>
  );
}
