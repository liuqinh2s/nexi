"use client";

import { useEffect, useRef } from "react";
import { siteConfig } from "@/config/site";

export function Comments() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current.childElementCount > 0) return;
    const script = document.createElement("script");
    script.src = "https://utteranc.es/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("repo", siteConfig.comments.repo);
    script.setAttribute("issue-term", siteConfig.comments.issueTerm);
    script.setAttribute("theme", siteConfig.comments.theme);
    ref.current.appendChild(script);
  }, []);

  if (!siteConfig.features.comments) return null;
  return <section aria-label="评论" className="comments" ref={ref} />;
}
