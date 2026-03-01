import { DM_Mono } from "next/font/google";
import "./globals.css";

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "hunting groundz₹",
  description: "a personal shopping tool",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${dmMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
