import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index];
  if (!value.startsWith("--")) continue;
  const next = process.argv[index + 1];
  if (next && !next.startsWith("--")) {
    args.set(value, next);
    index += 1;
  } else {
    args.set(value, true);
  }
}

const sourceArg = args.get("--source");
if (typeof sourceArg !== "string") {
  console.error("Usage: node scripts/migrate-hexo.mjs --source /path/to/hexo-blog [--write] [--overwrite]");
  process.exit(1);
}

const sourceRoot = path.resolve(sourceArg);
const hexoSource = fs.existsSync(path.join(sourceRoot, "source")) ? path.join(sourceRoot, "source") : sourceRoot;
const postsDirectory = fs.existsSync(path.join(hexoSource, "_posts"))
  ? path.join(hexoSource, "_posts")
  : path.join(sourceRoot, "_posts");
const imagesDirectory = path.join(hexoSource, "images");
const outputDirectory = path.resolve(String(args.get("--output") || path.join(process.cwd(), "content", "posts")));
const assetOutput = path.resolve(String(args.get("--assets") || path.join(process.cwd(), "public", "images", "legacy")));
const reportFile = path.resolve(
  String(args.get("--report") || path.join(process.cwd(), "reports", "hexo-migration.json")),
);
const shouldWrite = args.has("--write");
const overwrite = args.has("--overwrite");

if (!fs.existsSync(postsDirectory)) {
  console.error(`Hexo posts directory not found: ${postsDirectory}`);
  process.exit(1);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(from, to);
    else if (overwrite || !fs.existsSync(to)) fs.copyFileSync(from, to);
  }
}

function stripFencedCode(source) {
  return source
    .replace(/(^|\n)(```|~~~)[^\n]*\n[\s\S]*?\n\2(?=\n|$)/g, "\n")
    .replace(/`[^`\n]*`/g, "");
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function plainText(source) {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~|{}$\\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rewriteImages(source) {
  return source.replace(/(!\[[^\]]*\]\()([^)]+)(\))/g, (full, start, rawUrl, end) => {
    const [url, ...suffix] = rawUrl.trim().split(/\s+/);
    const marker = url.match(/(?:^|\/)images\/(.+)$/);
    if (!marker || /^https?:\/\//.test(url)) return full;
    const rewritten = `/images/legacy/${marker[1]}`;
    return `${start}${rewritten}${suffix.length ? ` ${suffix.join(" ")}` : ""}${end}`;
  });
}

function filenameData(file) {
  const basename = path.basename(file).replace(/\.md$/, "");
  const match = basename.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if (!match) return null;
  return { basename, date: `${match[1]}-${match[2]}-${match[3]}`, slug: match[4] };
}

const report = {
  source: sourceRoot,
  generatedAt: new Date().toISOString(),
  mode: shouldWrite ? "write" : "audit",
  totals: { discovered: 0, ready: 0, written: 0, existing: 0, skipped: 0 },
  skipped: [],
  ready: [],
};

const files = walk(postsDirectory).filter((file) => file.endsWith(".md"));
report.totals.discovered = files.length;

for (const file of files) {
  const filename = filenameData(file);
  if (!filename) {
    report.skipped.push({ file: path.relative(postsDirectory, file), reasons: ["filename_has_no_date"] });
    report.totals.skipped += 1;
    continue;
  }

  const raw = fs.readFileSync(file, "utf8");
  const parsed = matter(raw);
  const outsideCode = stripFencedCode(parsed.content);
  const reasons = [];
  if (/<script\b[^>]*>[\s\S]*?<\/script>/i.test(outsideCode)) reasons.push("embedded_script");
  if (/<style\b[^>]*>[\s\S]*?<\/style>/i.test(outsideCode)) reasons.push("embedded_style");
  if (!parsed.data.title) reasons.push("missing_title");

  if (reasons.length) {
    report.skipped.push({ file: path.relative(postsDirectory, file), reasons });
    report.totals.skipped += 1;
    continue;
  }

  const outputFile = path.join(outputDirectory, `${filename.basename}.mdx`);
  const descriptionSource = parsed.content.split(/<!--\s*more\s*-->/i)[0];
  const frontmatter = {
    title: String(parsed.data.title),
    slug: filename.slug,
    date: filename.date,
    description: plainText(descriptionSource).slice(0, 180),
    tags: normalizeList(parsed.data.tags),
    categories: normalizeList(parsed.data.categories),
    format: "markdown",
    comments: parsed.data.comments !== false,
  };
  const migrated = matter.stringify(rewriteImages(parsed.content).trimStart(), frontmatter);

  report.ready.push({
    source: path.relative(postsDirectory, file),
    output: path.relative(process.cwd(), outputFile),
  });
  report.totals.ready += 1;

  if (!shouldWrite) continue;
  if (fs.existsSync(outputFile) && !overwrite) {
    report.totals.existing += 1;
    continue;
  }
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, migrated, "utf8");
  report.totals.written += 1;
}

if (shouldWrite && fs.existsSync(imagesDirectory)) copyDirectory(imagesDirectory, assetOutput);
fs.mkdirSync(path.dirname(reportFile), { recursive: true });
fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report.totals, null, 2));
console.log(`Report: ${reportFile}`);
