import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";


import { TransitionWrapper } from "@/components/TransitionWrapper";
import { TopLeftHeader } from "@/components/TopLeftHeader";
import { TopRightHeader } from "@/components/TopRightHeader";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tourist Arrivals Forecast",
  description: "ML Pipeline for Forecasting Tourist Arrivals",
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
      suppressHydrationWarning
    >
      <body className="min-h-full flex text-foreground bg-background transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TopLeftHeader />
          <TopRightHeader />
          <main className="flex-1 w-full min-h-screen overflow-hidden relative">
            <TransitionWrapper>
              {children}
            </TransitionWrapper>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
