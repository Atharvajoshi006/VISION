import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ScrollProgress from "@/components/ui/scroll-progress";
import ToastContainer from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VISION – Hyper-Personalized Cognitive Learning Platform",
  description:
    "VISION is a coding-agent-inspired cognitive learning platform that helps you learn smarter, faster, and deeper — powered by adaptive AI.",
  keywords: ["AI learning", "adaptive education", "cognitive learning", "VISION"],
  authors: [{ name: "VISION" }],
  openGraph: {
    title: "VISION – Hyper-Personalized Cognitive Learning",
    description: "Learn smarter, faster, and deeper — powered by adaptive AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className={GeistSans.className}>
        <div className="noise-overlay" />
        <ScrollProgress />
        <ThemeProvider>
          {children}
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}

