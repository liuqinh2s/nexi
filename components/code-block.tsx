"use client";

import { useRef, useState, type HTMLAttributes } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock(props: HTMLAttributes<HTMLPreElement>) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    const code = ref.current?.textContent ?? "";
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="code-block">
      <button aria-label={copied ? "已复制" : "复制代码"} onClick={copyCode} title="复制代码" type="button">
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
      <pre ref={ref} {...props} />
    </div>
  );
}
