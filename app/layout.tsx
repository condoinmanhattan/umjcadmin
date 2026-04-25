import type { Metadata } from "next";
import "./globals.css";
import AuthLayoutWrapper from "@/components/AuthLayoutWrapper";

export const metadata: Metadata = {
  title: "렌탈 관리자 | Rental Admin",
  description: "가전렌탈 고객 관리 시스템 - AI 파싱 기반 고객등록, 관리, 잠재고객 DB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'light') {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <AuthLayoutWrapper>
          {children}
        </AuthLayoutWrapper>
      </body>
    </html>
  );
}
