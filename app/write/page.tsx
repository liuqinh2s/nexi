import type { Metadata } from "next";
import { BlogEditor } from "@/components/blog-editor";

export const metadata: Metadata = {
  title: "在线写作",
  description: "在线编辑、预览并发布博客内容",
};

export default function WritePage() {
  return <BlogEditor />;
}
