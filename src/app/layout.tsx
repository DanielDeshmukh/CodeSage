import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { PerformanceMonitor } from "@/components/performance-monitor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CodeSage - AI-Powered Codebase Examiner",
    template: "%s | CodeSage",
  },
  description:
    "AI-powered codebase examiner for viva, project review, and interview preparation. Powered by NVIDIA NIM 5-model stack.",
  keywords: [
    "code review",
    "interview preparation",
    "viva voce",
    "codebase analysis",
    "AI examiner",
    "NVIDIA NIM",
    "code quality",
    "developer assessment",
  ],
  authors: [{ name: "CodeSage" }],
  creator: "CodeSage",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://codesage.dev",
    siteName: "CodeSage",
    title: "CodeSage - AI-Powered Codebase Examiner",
    description:
      "AI-powered codebase examiner for viva, project review, and interview preparation.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CodeSage - AI-Powered Codebase Examiner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeSage - AI-Powered Codebase Examiner",
    description:
      "AI-powered codebase examiner for viva, project review, and interview preparation.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <PerformanceMonitor />
          <Header />
          <div className="flex flex-1 pt-[60px]">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
