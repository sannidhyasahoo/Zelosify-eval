import "@/styles/globals.css";
import { Inter, Geist_Mono } from "next/font/google";
import AllProvider from "@/redux/core/AllProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Zelosify — Contract hiring decisions, simplified",
    template: "%s · Zelosify",
  },
  description:
    "Zelosify helps hiring teams review contract candidates faster, with clear recommendations and an auditable decision trail.",
  icons: {
    icon: "/favicon1.ico",
  },
};

export const viewport = {
  themeColor: "#040506",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <AllProvider>{children}</AllProvider>
      </body>
    </html>
  );
}
