const containerPattern = /^:::[ \t]*([^\s]+)(?:[ \t]+([^\n]+))?[ \t]*\n([\s\S]*?)\n:::[ \t]*$/gm;

function transformOutsideCode(source: string, transform: (value: string) => string) {
  return source.split(/(```[\s\S]*?```|`[^`\n]+`)/g).map((part, index) => index % 2 ? part : transform(part)).join("");
}

export function normalizeMarkdownSource(source: string) {
  let normalized = source.replace(containerPattern, (_, type: string, title: string | undefined, body: string) => {
    const marker = `> [!${type.toUpperCase()}]${title ? ` ${title}` : ""}`;
    return `${marker}\n>\n${body.split("\n").map((line) => `> ${line}`).join("\n")}`;
  });

  normalized = transformOutsideCode(normalized, (value) => value
    .replace(/^\[TOC\]\s*$/gm, "<div data-markdown-toc=\"true\"></div>")
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => `$$${formula}$$`)
    .replace(/\\\((.+?)\\\)/g, (_, formula) => `$${formula}$`)
    .replace(/\[([^\]\n]+)\](?:\^\(([^)\n]+)\)|\{([^}\n]+)\})/g, (_, text, rtA, rtB) => `<ruby>${text}<rp>（</rp><rt>${rtA || rtB}</rt><rp>）</rp></ruby>`)
    .replace(/==([^=\n]+)==/g, "<mark>$1</mark>")
    .replace(/\+\+([^+\n]+)\+\+/g, "<u>$1</u>")
    .replace(/(^|[^~])~([^~\n]+)~(?!~)/g, "$1<span class=\"text-wavy\">$2</span>"));

  return normalized;
}

export function extractMarkdownHeadings(source: string) {
  const headings: Array<{ level: number; text: string; id: string }> = [];
  const counts = new Map<string, number>();
  for (const match of source.matchAll(/^(#{2,4})\s+(.+)$/gm)) {
    const text = match[2].replace(/[*_`~[\]]/g, "").trim();
    const base = text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-") || "section";
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    headings.push({ level: match[1].length, text, id: count ? `${base}-${count}` : base });
  }
  return headings;
}
