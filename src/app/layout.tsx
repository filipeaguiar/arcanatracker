import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { AppleSplashScreens } from "./AppleSplashScreens";
import { ThemeProvider } from "./theme-provider";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: {
    default: "Arcana Tracker — Controle Financeiro",
    template: "%s | Arcana Tracker",
  },
  description:
    "Sistema de controle financeiro pessoal com entrada rápida via DSL, suporte a cartões de crédito e faturas.",
  keywords: ["finanças", "controle financeiro", "DSL", "tracker"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Arcana Tracker",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
    <html lang="pt-BR" suppressHydrationWarning className={outfit.variable}>
      <head>
        <AppleSplashScreens />
      </head>
      <body className={outfit.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
