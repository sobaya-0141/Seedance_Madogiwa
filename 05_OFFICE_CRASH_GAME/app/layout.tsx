import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "そば屋のオフィスクラッシュ ～無限フロア大整理～";
const description =
  "大型ビールジョッキで物理備品を吹き飛ばし、衝突連鎖で暴走オフィスを片付ける3Dアクションハクスラ。8フロア、戦利品ビルド、ボス、永続記録に対応。";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    title,
    description,
    metadataBase,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ja_JP",
      images: [{ url: "/og-physics.png", width: 1536, height: 1024, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-physics.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
