import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";

import { I18nProvider } from "@/components/providers/i18n-provider";
import { NextDevtoolsLocaleSync } from "@/components/providers/next-devtools-locale-sync";
import { localeCookieName, type Locale } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resume Util",
  description: "在线简历生成与版本管理工具",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  const initialLocale: Locale = cookieLocale === "en" ? "en" : "zh-CN";

  return (
    <html
      lang={initialLocale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider initialLocale={initialLocale}>
          <NextDevtoolsLocaleSync />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
