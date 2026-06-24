import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Grandmaster — live chess tournaments with your friends",
  description:
    "Run round-robin, Swiss, single- and double-elimination chess tournaments. A live bracket everyone can watch, powered by Chess.com.",
  applicationName: "Grandmaster",
};

export const viewport: Viewport = {
  themeColor: "#0b0d12",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var m=localStorage.getItem('grandmaster:theme')||'dark';var a=localStorage.getItem('grandmaster:accent')||'gold';var e=document.documentElement;e.dataset.theme=m;if(a&&a!=='gold')e.dataset.accent=a;}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
        <footer className="border-t border-ink-800/80 py-8 text-center text-xs text-muted/70">
          Grandmaster · a friendly tournament hub built on the Chess.com public API
        </footer>
      </body>
    </html>
  );
}
