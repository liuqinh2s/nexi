import Link from "next/link";
import { PostMeta } from "@/components/post-meta";
import type { Post } from "@/types/content";

export function PostList({ posts }: { posts: Post[] }) {
  return (
    <section className="post-list">
      {posts.map((post) => (
        <article className="post-card" key={post.url}>
          <header>
            <h2>
              <Link href={post.url}>{post.title}</Link>
            </h2>
            <PostMeta post={post} />
          </header>
          {post.cover && <img alt="" className="post-cover" src={post.cover} />}
          <p>{post.description}</p>
          <Link className="read-more" href={post.url}>
            阅读全文 »
          </Link>
        </article>
      ))}
    </section>
  );
}
