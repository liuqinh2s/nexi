import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteShell } from "@/components/site-shell";

export default function NotFound() {
  return (
    <SiteShell>
      <section className="not-found-panel">
        <strong>404</strong>
        <h1>页面没有找到</h1>
        <p>这个链接可能已经移动，或者文章尚未发布。</p>
        <Link href="/">
          <ArrowLeft size={17} />
          返回首页
        </Link>
      </section>
    </SiteShell>
  );
}
