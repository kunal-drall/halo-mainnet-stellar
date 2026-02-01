import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Halo Protocol - Build Credit Through Community",
  description:
    "Join lending circles, build your credit score, and access financial opportunities on the Stellar blockchain.",
  keywords: [
    "credit score",
    "lending circles",
    "ROSCA",
    "Stellar",
    "blockchain",
    "DeFi",
  ],
  authors: [{ name: "Halo Protocol" }],
  openGraph: {
    title: "Halo Protocol",
    description: "Build Credit Through Community",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@halodotfun",
    creator: "@halodotfun",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
