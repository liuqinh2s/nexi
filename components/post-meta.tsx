import Link from "next/link";
import { Archive, CalendarDays, Clock3, FileText, RefreshCw } from "lucide-react";
import type { Post } from "@/types/content";

export function PostMeta({ post }: { post: Post }) {
  return (
    <div className="post-meta">
      <span>
        <CalendarDays size={13} />
        发表于 {post.date}
      </span>
      {post.updated && post.updated !== post.date && (
        <span>
          <RefreshCw size={13} />
          更新于 {post.updated}
        </span>
      )}
      {post.categories.map((category) => (
        <Link href={`/categories/${encodeURIComponent(category)}/`} key={category}>
          <Archive size={13} />
          {category}
        </Link>
      ))}
      <span>
        <FileText size={13} />
        {post.words.toLocaleString("zh-CN")} 字
      </span>
      <span>
        <Clock3 size={13} />
        阅读约 {post.readingMinutes} 分钟
      </span>
    </div>
  );
}
