import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "事實查核助手",
  description: "彙整公開查核來源，協助快速比對傳言",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
