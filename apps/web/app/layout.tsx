import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "AI RWA Recommendation Engine V2",
  description: "Open-model RWA recommendation MVP"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
