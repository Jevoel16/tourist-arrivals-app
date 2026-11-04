import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AppHeader } from "@/components/AppHeader";
import { PipelineStatusProvider } from "@/components/PipelineStatusProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TransitionWrapper } from "@/components/TransitionWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tourist Arrivals Forecasting Lab",
  description: "An eight-stage ML pipeline for forecasting Philippine tourist arrivals with an LSTM.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans text-foreground transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PipelineStatusProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg"
            >
              Skip to content
            </a>
            <AppHeader />
            <main id="main" className="relative w-full flex-1 overflow-x-clip">
              <TransitionWrapper>{children}</TransitionWrapper>
            </main>
            <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
              <p>
                Based on Tourist Arrivals Forecasting Lab by{" "}
                <a href="https://github.com/Jevoel16" className="font-medium text-foreground underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                  Sprucetrap
                </a>
                <span className="mx-2" aria-hidden>
                  ·
                </span>
                Press <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> on a stage to return to the overview
              </p>
            </footer>
          </PipelineStatusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
