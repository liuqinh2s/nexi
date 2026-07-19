import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import "./globals.css";
import { Analytics } from "@/components/analytics";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.title,
  authors: [{ name: siteConfig.author.name }],
  keywords: ["Next.js", "blog", "NexT", "Gemini"],
  alternates: {
    canonical: `${siteConfig.basePath}/`,
    types: { "application/rss+xml": `${siteConfig.basePath}/feed.xml` },
  },
  openGraph: {
    type: "website",
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.title,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        style={
          {
            "--site-background": `url("${siteConfig.background}")`,
          } as CSSProperties
        }
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
