import type { Metadata } from "next";
import Header from "@/components/layout/header";

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
    <div >
        <Header />

      <main className="mt-4">
        {children}
      </main>
    </div>
  );
}
