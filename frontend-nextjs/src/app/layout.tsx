import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "BGE Héroes de la Patria - Plataforma Educativa",
    description: "Plataforma educativa inteligente con gamificación, IA adaptativa y metaverso educativo",
    keywords: ["educación", "bachillerato", "IA", "gamificación", "aprendizaje adaptativo"],
    authors: [{ name: "BGE Héroes de la Patria" }],
    openGraph: {
        title: "BGE Héroes de la Patria",
        description: "Plataforma educativa de nueva generación",
        url: "https://bge-heroesdelapatria.vercel.app",
        siteName: "BGE Héroes de la Patria",
        images: [
            {
                url: "/images/og-image.jpg",
                width: 1200,
                height: 630,
            },
        ],
        locale: "es_MX",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "BGE Héroes de la Patria",
        description: "Plataforma educativa de nueva generación",
        images: ["/images/og-image.jpg"],
    },
    manifest: "/manifest.json",
    themeColor: "#1976D2",
    viewport: {
        width: "device-width",
        initialScale: 1,
        maximumScale: 1,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
