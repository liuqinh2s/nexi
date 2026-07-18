export type TocItem = {
  id: string;
  text: string;
  level: number;
};

export type Post = {
  title: string;
  slug: string;
  date: string;
  updated?: string;
  description: string;
  tags: string[];
  categories: string[];
  draft: boolean;
  featured: boolean;
  comments: boolean;
  format: "mdx" | "markdown";
  cover?: string;
  source: string;
  url: string;
  words: number;
  readingMinutes: number;
  toc: TocItem[];
};

export type ContentPage = {
  title: string;
  slug: string;
  description: string;
  source: string;
  toc: TocItem[];
};

export type SearchRecord = {
  title: string;
  description: string;
  url: string;
  tags: string[];
  categories: string[];
  text: string;
};
