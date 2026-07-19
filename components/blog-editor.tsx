"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bold,
  Check,
  ChevronDown,
  Clipboard,
  Code2,
  Columns2,
  Eye,
  FileText,
  Github,
  Heading2,
  ImageIcon,
  Import,
  Italic,
  KeyRound,
  Link2,
  List,
  ListOrdered,
  LoaderCircle,
  PencilLine,
  PanelLeft,
  Plus,
  Quote,
  Save,
  Settings2,
  X,
} from "lucide-react";
import { ExtendedMarkdown } from "@/components/extended-markdown";
import { HighlightedMarkdownEditor, type MarkdownEditorHandle } from "@/components/highlighted-markdown-editor";
import { siteConfig } from "@/config/site";

type ContentKind = "post" | "page";
type EditorMode = "write" | "split" | "preview";

type DocumentState = {
  kind: ContentKind;
  path: string;
  sha?: string;
  title: string;
  slug: string;
  date: string;
  description: string;
  tags: string;
  categories: string;
  draft: boolean;
  comments: boolean;
  format: "mdx" | "markdown";
  cover: string;
  body: string;
};

type GithubItem = { name: string; path: string; sha: string; type: "file" | "dir" };

const TOKEN_KEY = "nexi.github-token";
const emptyDocument = (): DocumentState => ({
  kind: "post",
  path: "",
  title: "",
  slug: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  tags: "",
  categories: "",
  draft: false,
  comments: true,
  format: "mdx",
  cover: "",
  body: "",
});

function splitList(value: string) {
  return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

function quote(value: string) {
  return JSON.stringify(value);
}

function parseScalar(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try { return JSON.parse(trimmed.replace(/'/g, '"')); } catch { return []; }
  }
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function parseFile(source: string, path: string, sha?: string): DocumentState {
  const base = emptyDocument();
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const data: Record<string, unknown> = {};
  if (match) {
    for (const line of match[1].split("\n")) {
      const separator = line.indexOf(":");
      if (separator > 0) data[line.slice(0, separator).trim()] = parseScalar(line.slice(separator + 1));
    }
  }
  const filename = path.split("/").pop()?.replace(/\.mdx?$/, "") ?? "";
  const datedName = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  const list = (value: unknown) => Array.isArray(value) ? value.join(", ") : "";
  return {
    ...base,
    kind: path.startsWith("content/pages/") ? "page" : "post",
    path,
    sha,
    title: String(data.title ?? ""),
    slug: String(data.slug ?? datedName?.[2] ?? filename),
    date: String(data.date ?? datedName?.[1] ?? base.date).slice(0, 10),
    description: String(data.description ?? ""),
    tags: list(data.tags),
    categories: list(data.categories),
    draft: data.draft === true,
    comments: data.comments !== false,
    format: data.format === "markdown" ? "markdown" : path.endsWith(".md") ? "markdown" : "mdx",
    cover: String(data.cover ?? ""),
    body: match ? source.slice(match[0].length) : source,
  };
}

function serializeFile(doc: DocumentState) {
  const lines = ["---", `title: ${quote(doc.title)}`, `slug: ${quote(doc.slug)}`];
  if (doc.kind === "post") {
    lines.push(
      `date: ${quote(doc.date)}`,
      `description: ${quote(doc.description)}`,
      `tags: ${JSON.stringify(splitList(doc.tags))}`,
      `categories: ${JSON.stringify(splitList(doc.categories))}`,
      `draft: ${doc.draft}`,
      `comments: ${doc.comments}`,
      `format: ${doc.format}`,
    );
    if (doc.cover.trim()) lines.push(`cover: ${quote(doc.cover.trim())}`);
  } else if (doc.description.trim()) {
    lines.push(`description: ${quote(doc.description.trim())}`);
  }
  return `${lines.join("\n")}\n---\n\n${doc.body.trimEnd()}\n`;
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[\\/:*?"<>|#%]/g, "-");
}

function encodeGithubPath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}

export function BlogEditor() {
  const [doc, setDoc] = useState<DocumentState>(emptyDocument);
  const [mode, setMode] = useState<EditorMode>("split");
  const [showInspector, setShowInspector] = useState(true);
  const [token, setToken] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [items, setItems] = useState<GithubItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [githubUser, setGithubUser] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const markdownEditorRef = useRef<MarkdownEditorHandle>(null);
  const previewRef = useRef<HTMLElement>(null);
  const editor = siteConfig.editor;

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY) ?? "";
    if (saved && !saved.startsWith("ghp_")) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    setToken(saved);
    setTokenDraft(saved);
    if (saved) void verifyToken(saved, false);
  }, []);

  const targetPath = useMemo(() => {
    if (doc.path) return doc.path;
    const extension = doc.format === "markdown" ? "md" : "mdx";
    const safeSlug = slugify(doc.slug || doc.title) || "untitled";
    return doc.kind === "post"
      ? `content/posts/${doc.date}-${safeSlug}.${extension}`
      : `content/pages/${safeSlug}.${extension}`;
  }, [doc]);

  function update<K extends keyof DocumentState>(key: K, value: DocumentState[K]) {
    setDoc((current) => ({ ...current, [key]: value }));
  }

  function insertMarkdown(before: string, after = "", placeholder = "文本") {
    markdownEditorRef.current?.insert(before, after, placeholder);
  }

  async function githubFetch(path: string, init?: RequestInit, authToken = token) {
    const response = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...init?.headers,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `GitHub 请求失败（${response.status}）`);
    }
    return response;
  }

  async function verifyToken(value = tokenDraft, save = true) {
    if (!value.trim()) { setNotice("请填写 GitHub Token"); return false; }
    if (!value.trim().startsWith("ghp_")) {
      setNotice("请使用以 ghp_ 开头的 GitHub Classic Token");
      return false;
    }
    setBusy(true);
    try {
      const response = await githubFetch("/user", undefined, value.trim());
      const user = await response.json();
      await githubFetch(`/repos/${editor.owner}/${editor.repo}`, undefined, value.trim());
      setGithubUser(user.login);
      setToken(value.trim());
      if (save) localStorage.setItem(TOKEN_KEY, value.trim());
      setShowToken(false);
      setNotice(`已连接 GitHub：${user.login}`);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Token 验证失败");
      return false;
    } finally { setBusy(false); }
  }

  async function loadLibrary() {
    setBusy(true);
    try {
      const directories = ["content/posts", "content/pages"];
      const results = await Promise.all(directories.map(async (directory) => {
        const response = await githubFetch(`/repos/${editor.owner}/${editor.repo}/contents/${directory}?ref=${encodeURIComponent(editor.branch)}`);
        return await response.json() as GithubItem[];
      }));
      setItems(results.flat().filter((item) => item.type === "file" && /\.mdx?$/.test(item.name)).sort((a, b) => b.name.localeCompare(a.name)));
      setShowLibrary(true);
    } catch (error) { setNotice(error instanceof Error ? error.message : "内容列表加载失败"); }
    finally { setBusy(false); }
  }

  async function openRemote(item: GithubItem) {
    setBusy(true);
    try {
      const response = await githubFetch(`/repos/${editor.owner}/${editor.repo}/contents/${encodeGithubPath(item.path)}?ref=${encodeURIComponent(editor.branch)}`);
      const file = await response.json();
      setDoc(parseFile(decodeBase64(file.content), item.path, file.sha));
      setShowLibrary(false);
      setMode("split");
      setNotice(`已载入 ${item.name}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "文件加载失败"); }
    finally { setBusy(false); }
  }

  function importFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const kind = doc.kind;
      const imported = parseFile(String(reader.result ?? ""), `${kind === "post" ? "content/posts" : "content/pages"}/${file.name}`);
      setDoc({ ...imported, kind, path: "", sha: undefined });
      setNotice(`已导入 ${file.name}`);
    };
    reader.readAsText(file);
  }

  async function publish() {
    if (!doc.title.trim() || !doc.slug.trim() || !doc.body.trim()) {
      setNotice("标题、slug 和正文不能为空");
      return;
    }
    if (!token) {
      setShowToken(true);
      setNotice("发布前请先验证 GitHub Token");
      return;
    }
    setBusy(true);
    try {
      let sha = doc.sha;
      if (!sha) {
        const exists = await fetch(`https://api.github.com/repos/${editor.owner}/${editor.repo}/contents/${encodeGithubPath(targetPath)}?ref=${encodeURIComponent(editor.branch)}`, {
          headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}` },
        });
        if (exists.ok) sha = (await exists.json()).sha;
      }
      const response = await githubFetch(`/repos/${editor.owner}/${editor.repo}/contents/${encodeGithubPath(targetPath)}`, {
        method: "PUT",
        body: JSON.stringify({
          message: `${sha ? "更新" : "发布"}${doc.kind === "post" ? "文章" : "页面"}：${doc.title}`,
          content: encodeBase64(serializeFile(doc)),
          branch: editor.branch,
          ...(sha ? { sha } : {}),
        }),
      });
      const result = await response.json();
      setDoc((current) => ({ ...current, path: targetPath, sha: result.content.sha }));
      setNotice(`发布成功，已提交到 ${editor.owner}/${editor.repo}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "发布失败"); }
    finally { setBusy(false); }
  }

  async function copyForWechat() {
    if (!previewRef.current || !doc.body.trim()) {
      setNotice("请先填写需要复制的内容");
      return;
    }
    const wrapper = document.createElement("section");
    wrapper.id = "wechat-content";
    if (doc.title.trim()) {
      const title = document.createElement("h1");
      title.textContent = doc.title;
      title.className = "wechat-title";
      wrapper.append(title);
    }
    const clone = previewRef.current.cloneNode(true) as HTMLElement;
    clone.className = "wechat-body";
    clone.querySelectorAll("button,script,style,.pane-label").forEach((element) => element.remove());
    clone.querySelectorAll('a[href^="#"]').forEach((element) => element.removeAttribute("href"));
    clone.querySelectorAll("li > ul, li > ol").forEach((list) => list.parentElement?.insertAdjacentElement("afterend", list));
    clone.querySelectorAll("img").forEach((image) => {
      const width = image.getAttribute("width");
      const height = image.getAttribute("height");
      if (width) { image.style.width = /^\d+$/.test(width) ? `${width}px` : width; image.removeAttribute("width"); }
      if (height) { image.style.height = /^\d+$/.test(height) ? `${height}px` : height; image.removeAttribute("height"); }
      image.style.maxWidth = "100%";
    });
    wrapper.append(...Array.from(clone.childNodes));
    const empty = document.createElement("p");
    empty.innerHTML = "&nbsp;";
    empty.setAttribute("style", "font-size:0;line-height:0;margin:0;");
    wrapper.prepend(empty.cloneNode(true));
    wrapper.append(empty);

    const wechatCss = `
      #wechat-content{max-width:677px;margin:0 auto;padding:20px 16px;color:#222;background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:16px;line-height:1.8;word-break:break-word}
      #wechat-content .wechat-title{margin:0 0 30px;padding:0 0 12px;border-bottom:2px solid #3370f4;color:#1f2329;font-size:26px;font-weight:700;line-height:1.35;text-align:center}
      #wechat-content h1{margin:38px 0 20px;padding-bottom:10px;border-bottom:2px solid #3370f4;color:#172b4d;font-size:25px;line-height:1.4;text-align:center}
      #wechat-content h2{margin:36px 0 18px;padding:7px 12px;border-left:4px solid #3370f4;color:#173b72;font-size:21px;line-height:1.45;background:#f2f6ff}
      #wechat-content h3{margin:30px 0 14px;color:#2457a6;font-size:18px;line-height:1.5}
      #wechat-content h4{margin:24px 0 12px;color:#374151;font-size:16px}
      #wechat-content p{margin:18px 0;color:#2c2f36;font-size:16px;line-height:1.85;letter-spacing:.02em}
      #wechat-content strong{color:#172b4d;font-weight:700}
      #wechat-content em{color:#5f4b8b}
      #wechat-content a{color:#3370f4;text-decoration:none;border-bottom:1px solid #9bb8fa}
      #wechat-content blockquote{margin:24px 0;padding:14px 18px;border-left:4px solid #8aa8e8;color:#5a6472;background:#f5f7fb}
      #wechat-content blockquote p{margin:5px 0;color:#5a6472}
      #wechat-content ul,#wechat-content ol{margin:18px 0;padding-left:28px}
      #wechat-content li{margin:7px 0;color:#30343b;line-height:1.75}
      #wechat-content hr{margin:34px 0;border:0;border-top:1px solid #d9dee8}
      #wechat-content img{display:block;max-width:100%;height:auto;margin:24px auto}
      #wechat-content table{width:100%;margin:24px 0;border-collapse:collapse;font-size:14px}
      #wechat-content th{padding:9px 10px;border:1px solid #cdd7e8;color:#173b72;font-weight:700;background:#edf3ff}
      #wechat-content td{padding:9px 10px;border:1px solid #d8dee8;color:#343a44}
      #wechat-content code{padding:2px 5px;border-radius:3px;color:#c0341d;background:#f4f5f7;font-family:Consolas,Monaco,monospace;font-size:14px}
      #wechat-content pre{margin:24px 0;padding:16px;overflow:auto;border-radius:6px;color:#e6edf3;background:#24292f;white-space:pre-wrap;word-break:break-all}
      #wechat-content pre code{padding:0;color:#e6edf3;background:transparent;font-size:13px;line-height:1.65}
      #wechat-content mark{padding:1px 4px;background:#fff1a8}
      #wechat-content .markdown-alert{margin:24px 0;padding:14px 18px;border:1px solid #d8e2f5;border-left:4px solid #3370f4;border-radius:5px;background:#f5f8ff}
      #wechat-content .markdown-alert-title{margin-bottom:6px;color:#2457a6;font-weight:700}
      #wechat-content .markdown-toc{margin:24px 0;padding:18px;border:1px solid #dce3ef;background:#f8faff}
      #wechat-content .mermaid-diagram,#wechat-content .plantuml-diagram,#wechat-content .infographic-diagram{margin:24px 0;max-width:100%;overflow:hidden}
      #wechat-content svg{max-width:100%;height:auto}
      #wechat-content .katex-display{margin:22px 0;overflow:hidden;text-align:center}
    `;
    const { default: juice } = await import("juice");
    const html = juice(`<style>${wechatCss}</style>${wrapper.outerHTML}`, {
      inlinePseudoElements: true,
      preserveImportant: true,
      resolveCSSVariables: false,
    });
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([`${doc.title}\n\n${doc.body}`], { type: "text/plain" }),
        })]);
      } else {
        const fallback = document.createElement("div");
        fallback.contentEditable = "true";
        fallback.style.position = "fixed";
        fallback.style.left = "-9999px";
        fallback.innerHTML = html;
        document.body.append(fallback);
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(fallback);
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand("copy");
        fallback.remove();
        selection?.removeAllRanges();
      }
      setNotice("已复制公众号富文本，可直接粘贴到微信编辑器");
    } catch {
      setNotice("复制失败，请允许浏览器访问剪贴板后重试");
    }
  }

  return (
    <main className="write-page">
      <header className="write-header">
        <div className="write-brand">
          <Link aria-label="返回博客" href="/"><ArrowLeft size={19} /></Link>
          <span className="write-logo"><PencilLine size={17} /> Nexi Write</span>
          <span className="write-divider" />
          <div className="document-switcher">
            <button className={doc.kind === "post" ? "active" : ""} onClick={() => setDoc({ ...emptyDocument(), kind: "post" })} type="button">文章</button>
            <button className={doc.kind === "page" ? "active" : ""} onClick={() => setDoc({ ...emptyDocument(), kind: "page" })} type="button">页面</button>
          </div>
        </div>
        <div className="write-actions">
          <button aria-label="内容库" className="icon-action" onClick={loadLibrary} title="内容库" type="button"><FileText size={17} /></button>
          <button aria-label="导入 MD/MDX" className="icon-action" onClick={() => fileInput.current?.click()} title="导入 MD/MDX" type="button"><Import size={17} /></button>
          <input ref={fileInput} accept=".md,.mdx,text/markdown" hidden onChange={(event) => importFile(event.target.files?.[0])} type="file" />
          <button className="wechat-copy-action" onClick={copyForWechat} type="button"><Clipboard size={16} /> 复制到公众号</button>
          <span className="write-divider" />
          <button className="github-action" onClick={() => setShowToken(true)} type="button"><span className={githubUser ? "connection-dot connected" : "connection-dot"} /><Github size={16} /> {githubUser || "连接 GitHub"}</button>
          <button className="publish-button" disabled={busy} onClick={publish} type="button">{busy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />} 发布内容</button>
        </div>
      </header>

      <div className="write-document-bar">
        <div className="document-heading">
          <span className="document-type">{doc.kind === "post" ? "POST" : "PAGE"}</span>
          <input className="title-input" onChange={(event) => update("title", event.target.value)} placeholder={doc.kind === "post" ? "输入文章标题…" : "输入页面标题…"} value={doc.title} />
          <span className="document-path">{targetPath}</span>
        </div>
        <div className="view-switcher" aria-label="编辑视图">
          <button aria-label="仅编辑" className={mode === "write" ? "active" : ""} onClick={() => setMode("write")} title="仅编辑" type="button"><PanelLeft size={16} /></button>
          <button aria-label="双栏" className={mode === "split" ? "active" : ""} onClick={() => setMode("split")} title="双栏" type="button"><Columns2 size={16} /></button>
          <button aria-label="仅预览" className={mode === "preview" ? "active" : ""} onClick={() => setMode("preview")} title="仅预览" type="button"><Eye size={16} /></button>
          <span className="write-divider" />
          <button aria-label="文章设置" className={showInspector ? "active" : ""} onClick={() => setShowInspector(!showInspector)} title="文章设置" type="button"><Settings2 size={16} /></button>
        </div>
      </div>

      <div className={`write-workspace mode-${mode} ${showInspector ? "with-inspector" : ""}`}>
        {mode !== "preview" && <section className="editor-pane">
          <div className="format-toolbar">
            <button aria-label="二级标题" onClick={() => insertMarkdown("## ", "", "标题")} title="二级标题" type="button"><Heading2 size={16} /></button>
            <span />
            <button aria-label="粗体" onClick={() => insertMarkdown("**", "**")} title="粗体" type="button"><Bold size={16} /></button>
            <button aria-label="斜体" onClick={() => insertMarkdown("*", "*")} title="斜体" type="button"><Italic size={16} /></button>
            <button aria-label="引用" onClick={() => insertMarkdown("> ", "", "引用内容")} title="引用" type="button"><Quote size={16} /></button>
            <button aria-label="行内代码" onClick={() => insertMarkdown("`", "`", "code")} title="行内代码" type="button"><Code2 size={16} /></button>
            <span />
            <button aria-label="链接" onClick={() => insertMarkdown("[", "](https://)", "链接文字")} title="链接" type="button"><Link2 size={16} /></button>
            <button aria-label="图片" onClick={() => insertMarkdown("![", "](https://)", "图片说明")} title="图片" type="button"><ImageIcon size={16} /></button>
            <button aria-label="无序列表" onClick={() => insertMarkdown("- ", "", "列表项")} title="无序列表" type="button"><List size={16} /></button>
            <button aria-label="有序列表" onClick={() => insertMarkdown("1. ", "", "列表项")} title="有序列表" type="button"><ListOrdered size={16} /></button>
          </div>
          <HighlightedMarkdownEditor ref={markdownEditorRef} onChange={(value) => update("body", value)} value={doc.body} />
        </section>}

        {mode !== "write" && <section className="preview-pane">
          <div className="pane-label"><Eye size={14} /> 实时预览</div>
          <article ref={previewRef} className="editor-preview article-body">
            {doc.body ? <ExtendedMarkdown source={doc.body} /> : <div className="empty-preview"><Eye size={30} /><strong>预览区域</strong><span>左侧输入内容后，这里会实时呈现最终效果</span></div>}
          </article>
        </section>}

        {showInspector && <aside className="write-sidebar">
          <div className="inspector-title"><div><Settings2 size={16} /><strong>内容设置</strong></div><button aria-label="关闭设置" onClick={() => setShowInspector(false)} type="button"><X size={16} /></button></div>
          <label>Slug<input onChange={(event) => update("slug", event.target.value)} placeholder="url-slug" value={doc.slug} /></label>
          {doc.kind === "post" && <label>发布日期<input onChange={(event) => update("date", event.target.value)} type="date" value={doc.date} /></label>}
          <label>摘要<textarea onChange={(event) => update("description", event.target.value)} placeholder="简短介绍这篇内容" rows={3} value={doc.description} /></label>
          {doc.kind === "post" && <>
            <label>标签<input onChange={(event) => update("tags", event.target.value)} placeholder="JavaScript, 随笔" value={doc.tags} /></label>
            <label>分类<input onChange={(event) => update("categories", event.target.value)} placeholder="技术, 生活" value={doc.categories} /></label>
            <label>封面图<input onChange={(event) => update("cover", event.target.value)} placeholder="https://…" value={doc.cover} /></label>
            <label>内容格式<select onChange={(event) => update("format", event.target.value as DocumentState["format"])} value={doc.format}><option value="mdx">MDX</option><option value="markdown">Markdown</option></select></label>
            <label className="check-row"><input checked={doc.draft} onChange={(event) => update("draft", event.target.checked)} type="checkbox" /> 保存为草稿</label>
            <label className="check-row"><input checked={doc.comments} onChange={(event) => update("comments", event.target.checked)} type="checkbox" /> 开启评论</label>
          </>}
          <div className="publish-note"><Github size={16} /><span>内容将提交到<br /><strong>{editor.owner}/{editor.repo}</strong> · {editor.branch}</span></div>
        </aside>}
      </div>

      <footer className="write-statusbar">
        <span><span className={doc.sha ? "status-dot saved" : "status-dot"} />{doc.sha ? "已载入仓库版本" : "本地草稿"}</span>
        <span>{doc.body.split("\n").length} 行</span>
        <span>{doc.body.replace(/\s/g, "").length} 字</span>
        <span>{doc.format === "mdx" ? "MDX" : "Markdown"}</span>
        <span className="status-spacer" />
        <span>{githubUser ? `GitHub · ${githubUser}` : "尚未连接 GitHub"}</span>
      </footer>

      {notice && <button className="write-notice" onClick={() => setNotice("")} type="button"><Check size={15} /> {notice}<X size={14} /></button>}

      {showToken && <div className="write-modal-backdrop" onClick={() => setShowToken(false)} role="presentation">
        <section aria-modal="true" className="write-modal" onClick={(event) => event.stopPropagation()} role="dialog">
          <button aria-label="关闭" className="modal-close" onClick={() => setShowToken(false)} type="button"><X size={18} /></button>
          <KeyRound size={25} /><h2>连接 GitHub</h2>
          <p>Token 只保存在当前浏览器的 localStorage 中，不会发送到博客服务器。</p>
          <label>Classic personal access token<input autoComplete="off" onChange={(event) => setTokenDraft(event.target.value)} placeholder="ghp_…" type="password" value={tokenDraft} /></label>
          <small>创建 Classic Token 时请勾选 <strong>repo</strong> 权限。请求将使用 <code>Authorization: Bearer ghp_…</code>，Token 仅保存在当前浏览器。</small>
          <button className="publish-button modal-submit" disabled={busy} onClick={() => void verifyToken()} type="button">{busy ? <LoaderCircle className="spin" size={16} /> : <Github size={16} />} 验证并保存</button>
        </section>
      </div>}

      {showLibrary && <div className="write-modal-backdrop" onClick={() => setShowLibrary(false)} role="presentation">
        <section aria-modal="true" className="write-modal library-modal" onClick={(event) => event.stopPropagation()} role="dialog">
          <button aria-label="关闭" className="modal-close" onClick={() => setShowLibrary(false)} type="button"><X size={18} /></button>
          <FileText size={25} /><h2>内容库</h2><p>选择 GitHub 仓库中的文章或导航页面继续编辑。</p>
          <div className="library-list">{items.map((item) => <button key={item.path} onClick={() => openRemote(item)} type="button"><span>{item.path.startsWith("content/pages") ? "页面" : "文章"}</span>{item.name}<ChevronDown size={15} /></button>)}</div>
          <button className="new-document" onClick={() => { setDoc(emptyDocument()); setShowLibrary(false); }} type="button"><Plus size={16} /> 新建文章</button>
        </section>
      </div>}
    </main>
  );
}
