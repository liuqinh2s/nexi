export const siteConfig = {
  title: "liuqinh2s' blog",
  shortTitle: "刘钦",
  subtitle: "Do something cool!",
  description: "Computer Science is not a magic. To be a hacker.",
  author: {
    name: "liuqinh2s",
    avatar: "https://avatars.githubusercontent.com/u/10215470?v=4",
    bio: "Coding, writing and thinking.",
  },
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://liuqinh2s.github.io",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  editor: {
    owner: "liuqinh2s",
    repo: "nexi",
    branch: "main",
  },
  postsPerPage: 3,
  since: "2017-01-01",
  background:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=85",
  features: {
    snowfall: true,
    comments: false,
    analytics: Boolean(process.env.NEXT_PUBLIC_GA_ID),
    pageViews: false,
  },
  analyticsId: process.env.NEXT_PUBLIC_GA_ID ?? "",
  navigation: [
    { label: "首页", href: "/", icon: "home" },
    { label: "关于", href: "/about/", icon: "user" },
    { label: "标签", href: "/tags/", icon: "tag" },
    { label: "分类", href: "/categories/", icon: "categories" },
    { label: "归档", href: "/archives/", icon: "archive" },
    { label: "日记", href: "/diary/", icon: "edit" },
    { label: "导航", href: "/navigation/", icon: "compass" },
  ],
  social: [
    { label: "GitHub", href: "https://github.com/liuqinh2s", icon: "github" },
    { label: "Twitter", href: "https://x.com/liuqinh2s", icon: "twitter" },
    { label: "RSS", href: "/feed.xml", icon: "rss" },
  ],
  blogroll: [
    { label: "liam", href: "https://lianera.github.io" },
    { label: "jiyanggg", href: "https://jiyanggg.github.io/" },
    { label: "曾小乱", href: "https://zengyuxin.com/" },
  ],
  comments: {
    repo: "liuqinh2s/blog-comment",
    issueTerm: "pathname",
    theme: "github-light",
  },
} as const;

export type SiteConfig = typeof siteConfig;
