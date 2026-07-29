import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Contrato de Arrendamiento Residencial",
	description:
		"Genera, personaliza y exporta tu contrato de arrendamiento en PDF listo para firmar — directo desde el navegador, sin instalar nada.",
	metadataBase: new URL(
		"https://araxielfenix.github.io/contrato-arrendamiento",
	),
	openGraph: {
		title: "Contrato de Arrendamiento Residencial",
		description:
			"Genera, personaliza y exporta tu contrato de arrendamiento en PDF listo para firmar — directo desde el navegador, sin instalar nada.",
		url: "https://araxielfenix.github.io/contrato-arrendamiento",
		siteName: "Generador de Contrato de Arrendamiento",
		images: [
			{
				url: "/og-image.svg",
				width: 1200,
				height: 630,
				alt: "Generador de Contrato de Arrendamiento Residencial",
			},
		],
		locale: "es_MX",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Contrato de Arrendamiento Residencial",
		description:
			"Genera, personaliza y exporta tu contrato de arrendamiento en PDF listo para firmar.",
		images: ["/og-image.svg"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	);
}
