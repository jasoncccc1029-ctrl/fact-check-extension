"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Claim = {
  text?: string;
  claimReview?: Array<{
    url?: string;
    title?: string;
    textualRating?: string;
    reviewDate?: string;
    publisher?: { name?: string; site?: string };
  }>;
};

function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
        color: "var(--muted)",
        fontSize: 14,
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <span className="fc-spinner-ring" aria-hidden />
      <span>查詢中…</span>
    </div>
  );
}

export default function FactCheckHome() {
  const params = useSearchParams();
  const [input, setInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Claim[]>([]);

  /** 避免 React Strict Mode 或 effect 重跑時對同一 URL query 重複打 API */
  const autoSearchKeyRef = useRef<string | null>(null);

  const handleSearch = useCallback(async (raw: string) => {
    const q = String(raw || "").trim();
    if (!q) return;
    setLoading(true);
    setActiveQuery(q);
    setInput(q);
    try {
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(q)}&lang=zh-TW`,
        { method: "GET", cache: "no-store" }
      );
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data = (await res.json()) as Claim[];
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const qParam = (params.get("query") || "").trim();
    if (!qParam) {
      autoSearchKeyRef.current = null;
      return;
    }

    // 搜尋框已與 URL 參數相同，且本次查詢狀態已對齊 → 不重複觸發
    if (input.trim() === qParam && activeQuery === qParam) {
      return;
    }

    if (autoSearchKeyRef.current === qParam) {
      return;
    }
    autoSearchKeyRef.current = qParam;
    void handleSearch(qParam);
  }, [params, input, activeQuery, handleSearch]);

  const tooLong = activeQuery.length > 30;

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "0 auto",
        padding: "24px 18px 48px",
        minHeight: "100vh",
        background:
          "radial-gradient(900px 400px at 20% -10%, rgba(10,132,255,.15), transparent 55%), #07080b",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>
        事實查核助手
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18 }}>
        輸入或貼上關鍵字，彙整多個查核來源的相關連結
      </p>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleSearch(input)}
          placeholder="關鍵字或選取文字…"
          style={{
            flex: "1 1 200px",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "rgba(16,18,22,.72)",
            color: "var(--text)",
            fontSize: 15,
          }}
        />
        <button
          type="button"
          onClick={() => void handleSearch(input)}
          disabled={loading}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,.08)",
            color: "var(--text)",
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          查核
        </button>
      </div>

      {loading && <LoadingSpinner />}

      {tooLong && activeQuery && !loading && (
        <div
          style={{
            background: "var(--warn-bg)",
            border: "1px solid rgba(255,159,10,.25)",
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          文字太長，建議選取 3–8 個關鍵字效果更好
        </div>
      )}

      {activeQuery && !loading && (
        <p style={{ fontSize: 14, marginBottom: 12 }}>
          查詢：<strong>「{activeQuery}」</strong> — 共 {results.length} 筆
        </p>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>延伸搜尋</span>
        <a
          href={
            activeQuery
              ? `https://cofacts.tw/search?query=${encodeURIComponent(activeQuery)}`
              : "https://cofacts.tw/"
          }
          target="_blank"
          rel="noreferrer"
        >
          Cofacts
        </a>
        <span style={{ color: "var(--muted)" }}>·</span>
        <a
          href={
            activeQuery
              ? `https://tfc-taiwan.org.tw/?s=${encodeURIComponent(activeQuery)}`
              : "https://tfc-taiwan.org.tw/"
          }
          target="_blank"
          rel="noreferrer"
        >
          台灣事實查核中心
        </a>
      </div>

      {activeQuery && !loading && results.length === 0 && (
        <p style={{ color: "var(--muted)", marginBottom: 16 }}>查無相關查核資料</p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {results.map((claim, i) => {
          const r = claim.claimReview?.[0];
          return (
            <li
              key={`${r?.url || ""}-${i}`}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>
                {r?.title || claim.text || "—"}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                {r?.publisher?.name || "—"}
                {r?.textualRating ? ` · ${r.textualRating}` : ""}
                {r?.reviewDate
                  ? ` · ${new Date(r.reviewDate).toLocaleDateString("zh-TW")}`
                  : ""}
              </div>
              {r?.url && (
                <a href={r.url} target="_blank" rel="noreferrer">
                  開啟原文
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <p
        style={{
          marginTop: 28,
          fontSize: 12,
          color: "var(--muted)",
          lineHeight: 1.5,
        }}
      >
        情緒越激動的訊息，越需要冷靜查核。
      </p>
    </main>
  );
}
