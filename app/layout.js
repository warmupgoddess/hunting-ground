import "./globals.css";

export const metadata = {
  title: "hunting groundz₹",
  description: "a personal shopping tool",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
