import type { Metadata } from "next";
import { Crimson_Pro, DM_Sans, JetBrains_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Nav from "@/components/Nav";

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-body",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "African MSDI — Federated Marine Spatial Data Infrastructure",
  description:
    "Continental federated portal for hydrographic and ocean data discovery across Africa. IHO S-100 compliant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${crimsonPro.variable} ${dmSans.variable} ${jetBrainsMono.variable} bg-ocean-deepest text-text-primary font-body`}>
        <div className="block md:hidden fixed inset-0 bg-ocean-deepest text-text-primary flex items-center justify-center p-4 z-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Desktop Only</h1>
            <p>This application is optimized for desktop viewing. Please access it from a desktop or laptop computer.</p>
          </div>
        </div>
        <div className="hidden md:block">
          <Nav />
          <main className="pt-14 h-screen">{children}</main>
        </div>
      </body>
    </html>
  );
}
