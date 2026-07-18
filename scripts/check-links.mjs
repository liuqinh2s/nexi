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

function targetFiles(href) {
  let pathname = href.split("#")[0].split("?")[0];
  if (!pathname || /^(https?:|mailto:|tel:|javascript:)/.test(pathname)) return null;
  if (basePath && pathname.startsWith(basePath)) pathname = pathname.slice(basePath.length) || "/";
  if (!pathname.startsWith("/")) return null;

  let decodedPathname;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    decodedPathname = pathname;
  }

  // Next's static export uses URL-encoded directory names for dynamic route
  // params, while static routes (such as tag pages) may retain Unicode names.
  // Check both forms so the validation follows the browser's URL resolution.
  const encodedPathname = decodedPathname
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return [...new Set([pathname, decodedPathname, encodedPathname])].map((candidate) =>
    candidate.endsWith("/")
      ? path.join(outputDirectory, candidate, "index.html")
      : path.join(outputDirectory, candidate),
  );
}

const failures = [];
for (const htmlFile of walk(outputDirectory).filter((file) => file.endsWith(".html"))) {
  const html = fs.readFileSync(htmlFile, "utf8");
  for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
    const targets = targetFiles(match[1]);
    if (targets && !targets.some((target) => fs.existsSync(target))) {
      failures.push(`${path.relative(outputDirectory, htmlFile)} -> ${match[1]}`);
    }
  }
}

if (failures.length) {
  console.error(`Found ${failures.length} broken internal links:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("All generated internal links resolve.");
