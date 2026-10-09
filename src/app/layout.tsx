import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { template: "%s · CreatorHub Studio", default: "CreatorHub Studio" },
  description: "Upload, publish and track the performance of your paid video content.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#121318" },
  ],
};

async function requestLocale() {
  const preferred = (await headers()).get("accept-language")?.split(",")[0]?.split(";")[0]?.trim();
  try {
    return preferred ? new Intl.Locale(preferred).toString() : "en-US";
  } catch {
    return "en-US";
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await requestLocale();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <body>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
