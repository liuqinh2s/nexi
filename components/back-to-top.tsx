"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(window.scrollY > 480);
      setProgress(scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 0);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (!visible) return null;

  return (
    <button
      aria-label="返回顶部"
      className="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="返回顶部"
      type="button"
    >
      <ArrowUp size={17} />
      <span>{progress}%</span>
    </button>
  );
}
