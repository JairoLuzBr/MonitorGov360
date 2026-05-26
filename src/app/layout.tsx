import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MonitorGov360",
    template: "%s | MonitorGov360",
  },
  description:
    "Plataforma de monitoramento e transparência de ações governamentais municipais. Do planejamento à entrega real.",
  keywords: [
    "governo",
    "transparência",
    "monitoramento",
    "obras públicas",
    "gestão pública",
    "municípios",
  ],
  authors: [{ name: "MonitorGov360" }],
  creator: "MonitorGov360",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "MonitorGov360",
    description: "Do planejamento à entrega real.",
    siteName: "MonitorGov360",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1E3A5F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            classNames: {
              toast: "font-sans",
            },
          }}
        />
      </body>
    </html>
  );
}
