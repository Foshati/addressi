import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import ClientProvider from "@/components/client-provider";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";

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
