import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduPath - AI智能留学申请平台",
  description: "让留学申请简单、高效、精准。基于50万+真实录取数据，科学规划你的申请之路。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}