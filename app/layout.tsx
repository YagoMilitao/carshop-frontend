import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { Barlow_Condensed, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { clientEnv } from "@/lib/env/client";
import { Providers } from "./providers";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'CarShop',
    template: '%s | CarShop',
  },
  description: 'CarShop — automotive upholstery services.',
  openGraph: {
    siteName: 'CarShop',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html
      lang="en-US"
      className={cn("font-sans", barlowCondensed.variable, manrope.variable)}
    >
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
