import type { MetadataRoute } from "next";
import { absoluteUrl, getAllPages, getAllPosts, getTaxonomy } from "@/lib/content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/tags/", "/categories/", "/archives/"];
  return [
    ...staticRoutes.map((route) => ({ url: absoluteUrl(route), changeFrequency: "weekly" as const })),
    ...getAllPages().map((page) => ({ url: absoluteUrl(`/${page.slug}/`), changeFrequency: "monthly" as const })),
    ...getTaxonomy("tags").map((tag) => ({
      url: absoluteUrl(`/tags/${encodeURIComponent(tag.name)}/`),
      changeFrequency: "weekly" as const,
    })),
    ...getTaxonomy("categories").map((category) => ({
      url: absoluteUrl(`/categories/${encodeURIComponent(category.name)}/`),
      changeFrequency: "weekly" as const,
    })),
    ...getAllPosts().map((post) => ({
      url: absoluteUrl(post.url),
      lastModified: post.updated ?? post.date,
      changeFrequency: "monthly" as const,
    })),
  ];
}
