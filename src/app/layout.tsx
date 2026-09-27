import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/LanguageContext";
import { ToastProvider } from "@/components/Toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "ScamShield BD — Detect scams before they cost you",
  description:
    "AI-powered scam detection, reporting, and community intelligence platform built for Bangladesh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased app-body">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("ssb_theme")||"dark";document.documentElement.classList.toggle("light",t==="light");document.documentElement.classList.toggle("dark",t!=="light");}catch(e){document.documentElement.classList.add("dark");}})();`,
          }}
        />
        <AppProvider>
          <ToastProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
