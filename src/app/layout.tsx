import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: {
    default: "Tracker — Controle Financeiro",
    template: "%s | Tracker",
  },
  description:
    "Sistema de controle financeiro pessoal com entrada rápida via DSL, suporte a cartões de crédito e faturas.",
  keywords: ["finanças", "controle financeiro", "DSL", "tracker"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark" className={outfit.variable}>
      <head>
        <link rel="icon" href="/icon.png" />
      </head>
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
