import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AssetTag Register",
    template: "%s · AssetTag Register",
  },
  description:
    "Photograph, tag and document every asset across every site. QR labels, AI-assisted manuals and a detailed exportable register.",
  applicationName: "AssetTag Register",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AssetTag",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
