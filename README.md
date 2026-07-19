# Nexi Gemini Blog

A static-first Next.js blog template inspired by the NexT Gemini layout.

## Start locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Write a post

Open `/write/` to create or edit posts and navigation pages in the browser. The editor supports Markdown/MDX import, live preview, loading existing repository content, and publishing through the GitHub Contents API. A verified GitHub token is stored only in the current browser's `localStorage`; use a fine-grained token with Contents read/write access to this repository.

Create an `.md` or `.mdx` file in `content/posts`. The filename can keep the Hexo-style date prefix:

```text
2026-07-05-my-post.mdx
```

```yaml
---
title: "My post"
slug: "my-post"
date: "2026-07-05"
updated: "2026-07-17"
description: "A short summary used on the home page and for SEO."
tags: ["Next.js", "Blog"]
categories: ["Engineering"]
draft: false
featured: false
comments: true
cover: "https://example.com/cover.jpg"
---
```

The generated URL is `/2026/07/05/my-post/`. Put `<!-- more -->` after the home-page excerpt when migrating Hexo posts.

## Add a page

Create a file in `content/pages` with `title`, `slug` and optional `description`. Add its route to `navigation` in `config/site.ts` when it should appear in the sidebar.

## Configure the site

Edit `config/site.ts` to change:

- title, author, avatar and description;
- navigation, social links and blogroll;
- background image, snowfall and pagination;
- comments and analytics adapters.

Utterances configuration is included but comments are disabled by default. Enable `features.comments` after changing the repository setting.

Set `NEXT_PUBLIC_GA_ID` to enable Google Analytics. Without the environment variable, no analytics script is loaded.

## Markdown features

- GitHub Flavored Markdown
- MDX components
- syntax highlighting and code copy buttons
- KaTeX math
- automatic heading anchors and sidebar table of contents
- image lightbox

## Static deployment

The project exports to `out` and includes a GitHub Pages workflow.

For a repository site such as `https://username.github.io/blog/`, use:

```bash
NEXT_PUBLIC_SITE_URL=https://username.github.io \
NEXT_PUBLIC_BASE_PATH=/blog \
npm run check
```

For a root domain, leave `NEXT_PUBLIC_BASE_PATH` empty.

## Migrate a Hexo blog

Audit first:

```bash
npm run migrate:hexo -- --source /path/to/hexo-blog
```

Write compatible posts and copy local images:

```bash
npm run migrate:hexo -- --source /path/to/hexo-blog --write
```

The command is repeatable and does not overwrite existing posts unless `--overwrite` is supplied. Articles containing executable script or style blocks are listed in `reports/hexo-migration.json` for manual treatment.

## Verification

```bash
npm run check
```

This runs TypeScript validation, a production static export, and an internal-link check.
