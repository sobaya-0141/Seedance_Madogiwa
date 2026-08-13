import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "そば屋のオフィス更地クラッシュ ～全部壊して快適です！～";
const description =
  "オフィスの外壁を破り、麻布十番へ進出。街を壊すほど巨大化するそば屋が、ビールビームとジョッキメテオで周辺一帯を更地へ戻す全破壊3Dアクション。";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host")
    ?? requestHeaders.get("host")
    ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto")
    ?? (host.startsWith("localhost") ? "http" : "https");
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
      images: [
        {
          url: "/og.png",
          width: 1536,
          height: 1024,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
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
