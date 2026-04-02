import { Suspense } from "react";
import FactCheckHome from "@/components/FactCheckHome";

export default function Page() {
  return ( 
    <Suspense
      fallback={
        <main style={{ padding: 24, color: "rgba(255,255,255,.9)" }}>載入中…</main>
      }
    >
      <FactCheckHome />
    </Suspense>
  );
}
