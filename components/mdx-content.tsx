import type { AnchorHTMLAttributes, ComponentProps, ImgHTMLAttributes } from "react";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { Pluggable } from "unified";
import { ArticleInteractions } from "@/components/article-interactions";
import { ExtendedMarkdown, MarkdownAlert, SpecialCodeBlock } from "@/components/extended-markdown";
import { siteConfig } from "@/config/site";
import { normalizeMarkdownSource } from "@/lib/markdown-extensions";

function ArticleLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = typeof props.href === "string" && /^https?:\/\//.test(props.href);
  return <a {...props} rel={external ? "noreferrer" : props.rel} target={external ? "_blank" : props.target} />;
}

function ArticleImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const src = typeof props.src === "string" && props.src.startsWith("/")
    ? `${siteConfig.basePath}${props.src}`
    : props.src;
  return <img {...props} alt={props.alt ?? ""} loading="lazy" src={src} />;
}

function LegacyIframe(props: ComponentProps<"iframe">) {
  return <iframe {...props} loading="lazy" title={props.title ?? "嵌入内容"} />;
}

const rehypePlugins: Pluggable[] = [
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: "wrap" }],
  [rehypePrettyCode, { theme: "one-dark-pro", keepBackground: false }],
  rehypeKatex,
];

export async function MdxContent({
  source,
  format = "mdx",
}: {
  source: string;
  format?: "mdx" | "markdown";
}) {
  if (format === "markdown") {
    return (
      <ArticleInteractions>
        <div className="article-body"><ExtendedMarkdown source={source} /></div>
      </ArticleInteractions>
    );
  }

  const { content } = await compileMDX({
    source: normalizeMarkdownSource(source),
    components: {
      a: ArticleLink,
      blockquote: MarkdownAlert,
      img: ArticleImage,
      iframe: LegacyIframe,
      pre: SpecialCodeBlock,
    },
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [...rehypePlugins],
      },
    },
  });

  return (
    <ArticleInteractions>
      <div className="article-body">{content}</div>
    </ArticleInteractions>
  );
}
