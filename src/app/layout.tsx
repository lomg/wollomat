import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";

export const metadata: Metadata = {
  title: "Wollomat | Collect Group Signatures",
  description: "Wollomat makes it easy for closed groups, clubs, or coworkers to collectively sign texts with simple, secure email verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col justify-between">
        <LanguageProvider>
          <GlobalHeader />

          <main className="flex-grow flex flex-col justify-start">
            {children}
          </main>

          <GlobalFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
