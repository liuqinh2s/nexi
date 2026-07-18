import "server-only";

import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import { toString } from "mdast-util-to-string";
import readingTime from "reading-time";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { z } from "zod";
import remarkParse from "remark-parse";
import { siteConfig } from "@/config/site";
import type { ContentPage, Post, SearchRecord, TocItem } from "@/types/content";

const postsDirectory = path.join(process.cwd(), "content", "posts");
const pagesDirectory = path.join(process.cwd(), "content", "pages");

const frontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  date: z.union([z.string(), z.date()]).optional(),
  updated: z.union([z.string(), z.date()]).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  comments: z.boolean().default(true),
  format: z.enum(["mdx", "markdown"]).default("mdx"),
  cover: z.string().optional(),
});

function listMdxFiles(directory: string) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));
}

function normalizeDate(value: string | Date | undefined, fallback: string) {
  if (!value) return fallback;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function filenameParts(filename: string) {
  const name = filename.replace(/\.mdx?$/, "");
  const match = name.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if (!match) return { date: "1970-01-01", slug: name };
  return { date: `${match[1]}-${match[2]}-${match[3]}`, slug: match[4] };
}

function plainText(source: string) {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~\[\]()!|{}$\\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptFrom(source: string) {
  const excerptSource = source.split("<!-- more -->")[0];
  return plainText(excerptSource).slice(0, 180);
}

function extractToc(source: string): TocItem[] {
  const tree = unified().use(remarkParse).parse(source);
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];

  visit(tree, "heading", (node) => {
    if (node.depth > 3) return;
    const text = toString(node).trim();
    if (!text) return;
    items.push({ id: slugger.slug(text), text, level: node.depth });
  });

  return items;
}

function parsePost(filename: string): Post {
  const filepath = path.join(postsDirectory, filename);
  const file = fs.readFileSync(filepath, "utf8");
  const { data, content } = matter(file);
  const parsed = frontmatterSchema.parse(data);
  const fallback = filenameParts(filename);
  const date = normalizeDate(parsed.date, fallback.date);
  const slug = parsed.slug ?? fallback.slug;
  const [year, month, day] = date.split("-");
  const cleanSource = content.replace("<!-- more -->", "");
  const reading = readingTime(cleanSource);

  return {
    title: parsed.title,
    slug,
    date,
    updated: parsed.updated ? normalizeDate(parsed.updated, date) : undefined,
    description: parsed.description ?? excerptFrom(content),
    tags: parsed.tags,
    categories: parsed.categories,
    draft: parsed.draft,
    featured: parsed.featured,
    comments: parsed.comments,
    format: parsed.format,
    cover: parsed.cover,
    source: cleanSource,
    url: `/${year}/${month}/${day}/${slug}/`,
    words: plainText(cleanSource).replace(/\s/g, "").length,
    readingMinutes: Math.max(1, Math.ceil(reading.minutes)),
    toc: extractToc(cleanSource),
  };
}

let _postsCache: Post[] | null = null;

export function getAllPosts() {
  if (_postsCache) return _postsCache;
  _postsCache = listMdxFiles(postsDirectory)
    .map(parsePost)
    .filter((post) => !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
  return _postsCache;
}

export function getPostByRoute(year: string, month: string, day: string, slug: string) {
  return getAllPosts().find(
    (post) => post.date === `${year}-${month}-${day}` && post.slug === decodeURIComponent(slug),
  );
}

export function getAdjacentPosts(post: Post) {
  const posts = getAllPosts();
  const index = posts.findIndex((item) => item.url === post.url);
  return {
    newer: index > 0 ? posts[index - 1] : undefined,
    older: index >= 0 && index < posts.length - 1 ? posts[index + 1] : undefined,
  };
}

export function getPostsByTag(tag: string) {
  return getAllPosts().filter((post) => post.tags.includes(decodeURIComponent(tag)));
}

export function getPostsByCategory(category: string) {
  return getAllPosts().filter((post) => post.categories.includes(decodeURIComponent(category)));
}

export function getTaxonomy(type: "tags" | "categories") {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const value of post[type]) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

export function getSiteStats() {
  const posts = getAllPosts();
  return {
    posts: posts.length,
    tags: getTaxonomy("tags").length,
    categories: getTaxonomy("categories").length,
    words: posts.reduce((total, post) => total + post.words, 0),
  };
}

export function getSearchRecords(): SearchRecord[] {
  return getAllPosts().map((post) => ({
    title: post.title,
    description: post.description,
    url: post.url,
    tags: post.tags,
    categories: post.categories,
    text: plainText(post.source).slice(0, 2400),
  }));
}

export function getAllPages(): ContentPage[] {
  return listMdxFiles(pagesDirectory).map((filename) => {
    const file = fs.readFileSync(path.join(pagesDirectory, filename), "utf8");
    const { data, content } = matter(file);
    const parsed = frontmatterSchema.pick({ title: true, slug: true, description: true }).parse(data);
    const slug = parsed.slug ?? filename.replace(/\.mdx?$/, "");
    return {
      title: parsed.title,
      slug,
      description: parsed.description ?? excerptFrom(content),
      source: content,
      toc: extractToc(content),
    };
  });
}

export function getPageBySlug(slug: string) {
  return getAllPages().find((page) => page.slug === slug);
}

export function absoluteUrl(pathname: string) {
  return `${siteConfig.url}${siteConfig.basePath}${pathname}`;
}
