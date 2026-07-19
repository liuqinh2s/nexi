"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";

export type MarkdownEditorHandle = {
  focus(): void;
  insert(before: string, after?: string, placeholder?: string): void;
};

export const HighlightedMarkdownEditor = forwardRef<MarkdownEditorHandle, {
  value: string;
  onChange: (value: string) => void;
}>(function HighlightedMarkdownEditor({ value, onChange }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useImperativeHandle(ref, () => ({
    focus() { viewRef.current?.focus(); },
    insert(before, after = "", placeholder = "文本") {
      const view = viewRef.current;
      if (!view) return;
      const selection = view.state.selection.main;
      const selected = view.state.sliceDoc(selection.from, selection.to) || placeholder;
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: `${before}${selected}${after}` },
        selection: { anchor: selection.from + before.length, head: selection.from + before.length + selected.length },
        scrollIntoView: true,
      });
      view.focus();
    },
  }), []);

  useEffect(() => {
    if (!hostRef.current) return;
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown({ codeLanguages: languages }),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.theme({
            "&": { height: "100%", backgroundColor: "#fff" },
            ".cm-scroller": { overflow: "auto", fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace' },
            ".cm-content": { minHeight: "100%", padding: "28px clamp(24px, 4vw, 58px) 70px", fontSize: "14px", lineHeight: "1.9", caretColor: "#1d4ed8" },
            ".cm-line": { padding: "0" },
            ".cm-gutters": { display: "none" },
            ".cm-focused": { outline: "none" },
            ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "rgba(55,112,244,.18) !important" },
            ".cm-cursor": { borderLeftColor: "#1d4ed8", borderLeftWidth: "2px" },
            ".tok-heading": { color: "#0869e8", fontWeight: "750" },
            ".tok-strong": { color: "#b42318", fontWeight: "750" },
            ".tok-emphasis": { color: "#7b3fc6", fontStyle: "italic" },
            ".tok-link, .tok-url": { color: "#167f67" },
            ".tok-string, .tok-monospace": { color: "#a34b12" },
            ".tok-meta": { color: "#9b6400" },
            ".tok-quote": { color: "#68717d", fontStyle: "italic" },
            ".tok-punctuation": { color: "#8b5b13" },
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [value]);

  return <div className="codemirror-editor" ref={hostRef} />;
});
