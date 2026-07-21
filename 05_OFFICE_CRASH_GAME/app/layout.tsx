import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "そば屋のオフィスクラッシュ";
const description =
  "窓際族のそば屋を操作し、強化ゲートを攻略してオフィスの備品を壊す45秒スコアアタックゲーム。";

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
      images: [{ url: "/og-voxel.png", width: 1731, height: 909, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-voxel.png"],
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
