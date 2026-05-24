import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "مقهى البريوشة | طرابلس",
  description:
    "بريوش طرابلسي، فروبي، عصائر وقهوة — الطعم الطرابلسي الأصلي في طرابلس، ليبيا",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`}>
      <body className="pattern-bg min-h-full font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}
