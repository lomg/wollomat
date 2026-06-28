import type { Metadata } from "next";
import "./globals.css";

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
        <header className="border-b border-border py-4 px-6 glassmorphism sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" id="header-logo-link" className="flex items-center space-x-2 text-xl font-bold tracking-tight">
              <span className="text-accent-warm">✒</span>
              <span>Wollomat</span>
            </a>
            <div className="text-xs text-secondary-foreground font-mono bg-secondary px-2.5 py-1 rounded-full">
              v1.0.0
            </div>
          </div>
        </header>

        <main className="flex-grow flex flex-col justify-start">
          {children}
        </main>

        <footer className="border-t border-border py-6 px-6 bg-card text-center text-xs text-secondary-foreground mt-auto">
          <div className="max-w-6xl mx-auto flex justify-center">
            <p>
              &copy; {new Date().getFullYear()} Wollomat.{" "}
              <a 
                href="https://github.com/lomg/wollomat" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-accent-warm hover:underline transition-colors font-medium"
              >
                OpenSource Group Document Signatures
              </a>
              .
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
