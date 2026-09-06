import type { Metadata } from "next";
import { Hammersmith_One } from "next/font/google";
import "./globals.css";

const hammersmithOne = Hammersmith_One({
  variable: "--font-hammersmith-one",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Accounts",
  description: "Professional accounting management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hammersmithOne.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}