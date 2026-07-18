import fs from "node:fs";
import path from "node:path";

const outputDirectory = path.join(process.cwd(), "out");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function targetFile(href) {
  let pathname = href.split("#")[0].split("?")[0];
  if (!pathname || /^(https?:|mailto:|tel:|javascript:)/.test(pathname)) return null;
  if (basePath && pathname.startsWith(basePath)) pathname = pathname.slice(basePath.length) || "/";
  pathname = decodeURIComponent(pathname);
  if (!pathname.startsWith("/")) return null;
  if (pathname.endsWith("/")) return path.join(outputDirectory, pathname, "index.html");
  return path.join(outputDirectory, pathname);
}

const failures = [];
for (const htmlFile of walk(outputDirectory).filter((file) => file.endsWith(".html"))) {
  const html = fs.readFileSync(htmlFile, "utf8");
  for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
    const target = targetFile(match[1]);
    if (target && !fs.existsSync(target)) failures.push(`${path.relative(outputDirectory, htmlFile)} -> ${match[1]}`);
  }
}

if (failures.length) {
  console.error(`Found ${failures.length} broken internal links:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("All generated internal links resolve.");
