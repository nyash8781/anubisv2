import type { Metadata } from "next";
import { Calistoga, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/posthog-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

const calistoga = Calistoga({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-calistoga",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Anubis — Contractor Operations, Reimagined",
  description:
    "AI-powered opportunity management, homeowner portal, proposals, change orders, and payments — built to make small contractors look like pros on every customer touchpoint.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${calistoga.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <PostHogProvider>
            <AuthProvider>{children}</AuthProvider>
            <Toaster position="bottom-right" richColors />
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
