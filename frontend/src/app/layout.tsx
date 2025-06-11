import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import ClientProvider from "@/components/client-provider";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from '@/components/query-provider';
import { CurrencySwitcher } from "@/components/currency-switcher";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/ModeToggle";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Temp Mail - Free Virtual Phone Numbers & Temporary Email",
  description:
    "Create a temporary email address and get free virtual phone numbers to protect your online privacy. Use it for any website or app, and keep your real inbox clean and secure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="min-h-screen flex flex-col">
                <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
                  <div className="container mx-auto h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <Link href="/" className="font-bold text-lg flex items-center gap-2">
                        Addressi
                      </Link>
                      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
                        <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
                      </nav>
                    </div>
                    <div className="flex items-center gap-4">
                      <ModeToggle />
                      <CurrencySwitcher />
                    </div>
                  </div>
                </header>
                <main className="flex-grow container mx-auto py-8">
                  {children}
                  <Toaster richColors />
                </main>
              </div>
            </ThemeProvider>
          </QueryProvider>
        </ClientProvider>
      </body>
    </html>
  );
}
