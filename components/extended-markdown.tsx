"use client";

import { Children, cloneElement, isValidElement, useEffect, useId, useMemo, useState, type HTMLAttributes, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, Lightbulb, ShieldAlert, TriangleAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import plantumlEncoder from "plantuml-encoder";
import { CodeBlock } from "@/components/code-block";
import { extractMarkdownHeadings, normalizeMarkdownSource } from "@/lib/markdown-extensions";

const alertMeta: Record<string, { label: string; icon: typeof Info }> = {
  NOTE: { label: "注意", icon: Info },
  TIP: { label: "提示", icon: Lightbulb },
  IMPORTANT: { label: "重要", icon: ShieldAlert },
  WARNING: { label: "警告", icon: TriangleAlert },
  CAUTION: { label: "谨慎", icon: AlertCircle },
  THEOREM: { label: "定理", icon: CheckCircle2 },
  DEFINITION: { label: "定义", icon: Info },
  PROOF: { label: "证明", icon: CheckCircle2 },
};

function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return "";
}

export function MarkdownAlert({ children }: { children?: ReactNode }) {
  const parts = Children.toArray(children);
  const firstIndex = parts.findIndex((part) => isValidElement(part));
  const first = parts[firstIndex];
  const text = nodeText(first);
  const match = text.match(/^\s*\[!([^\]]+)\](?:[ \t]+([^\n]+))?/i);
  if (!match) return <blockquote>{children}</blockquote>;
  const type = match[1].toUpperCase();
  const meta = alertMeta[type] ?? { label: match[1], icon: Info };
  const Icon = meta.icon;
  const customTitle = match[2]?.trim();
  const remaining = text.slice(match[0].length).trim();
  const firstContent = remaining && isValidElement<{ children?: ReactNode }>(first)
    ? cloneElement(first, {}, remaining)
    : null;
  return <aside className={`markdown-alert alert-${type.toLowerCase()}`}>
    <div className="markdown-alert-title"><Icon size={17} />{customTitle || meta.label}</div>
    {firstContent}{parts.slice(firstIndex + 1)}
  </aside>;
}

function MermaidDiagram({ source }: { source: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
      try {
        const result = await mermaid.render(`mermaid-${id}`, source);
        if (active) setSvg(result.svg);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Mermaid 图表解析失败");
      }
    });
    return () => { active = false; };
  }, [id, source]);
  if (error) return <div className="diagram-error"><strong>Mermaid 渲染失败</strong><span>{error}</span></div>;
  if (!svg) return <div className="diagram-loading">正在渲染 Mermaid 图表…</div>;
  return <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function PlantUmlDiagram({ source }: { source: string }) {
  const encoded = plantumlEncoder.encode(source);
  return <figure className="plantuml-diagram">
    <img alt="PlantUML 图表" loading="lazy" src={`https://www.plantuml.com/plantuml/svg/${encoded}`} />
    <figcaption>PlantUML</figcaption>
  </figure>;
}

function InfographicDiagram({ source }: { source: string }) {
  const lines = source.split("\n").map((line) => line.trim()).filter(Boolean);
  const field = (name: string) => lines.find((line) => line.startsWith(`${name} `))?.slice(name.length + 1) ?? "";
  const items: Array<{ label: string; value: string; desc: string }> = [];
  let current: { label: string; value: string; desc: string } | undefined;
  for (const line of lines) {
    if (line.startsWith("- label ")) {
      current = { label: line.slice(8), value: "", desc: "" };
      items.push(current);
    } else if (current && line.startsWith("value ")) current.value = line.slice(6);
    else if (current && line.startsWith("desc ")) current.desc = line.slice(5);
  }
  return <section className="infographic-diagram">
    <header><span>INFOGRAPHIC</span><h3>{field("title") || "信息图"}</h3>{field("desc") && <p>{field("desc")}</p>}</header>
    <div className="infographic-items">{items.map((item, index) => <div className="infographic-item" key={`${item.label}-${index}`}>
      <strong>{item.value}</strong><h4>{item.label}</h4><p>{item.desc}</p>
    </div>)}</div>
  </section>;
}

export function SpecialCodeBlock({ children, ...props }: HTMLAttributes<HTMLPreElement>) {
  const child = Children.toArray(children)[0];
  if (isValidElement<{ className?: string; children?: ReactNode }>(child)) {
    const language = child.props.className?.match(/language-([\w-]+)/)?.[1]?.toLowerCase();
    const source = nodeText(child.props.children).replace(/\n$/, "");
    if (language === "mermaid") return <MermaidDiagram source={source} />;
    if (language === "plantuml") return <PlantUmlDiagram source={source} />;
    if (language === "infographic") return <InfographicDiagram source={source} />;
  }
  return <CodeBlock {...props}>{children}</CodeBlock>;
}

function MarkdownToc({ headings }: { headings: ReturnType<typeof extractMarkdownHeadings> }) {
  if (!headings.length) return null;
  return <nav className="markdown-toc"><strong>目录</strong><ol>{headings.map((heading) => <li className={`toc-level-${heading.level}`} key={heading.id}><a href={`#${heading.id}`}>{heading.text}</a></li>)}</ol></nav>;
}

export function ExtendedMarkdown({ source }: { source: string }) {
  const normalized = useMemo(() => normalizeMarkdownSource(source), [source]);
  const headings = useMemo(() => extractMarkdownHeadings(source), [source]);
  return <ReactMarkdown
    components={{
      blockquote: MarkdownAlert,
      div: ({ node, ...props }) => node?.properties?.dataMarkdownToc ? <MarkdownToc headings={headings} /> : <div {...props} />,
      pre: SpecialCodeBlock,
    }}
    rehypePlugins={[rehypeRaw, rehypeSlug, rehypeKatex, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
    remarkPlugins={[remarkGfm, remarkMath]}
  >{normalized}</ReactMarkdown>;
}
