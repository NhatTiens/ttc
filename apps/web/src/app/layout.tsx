import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { APP_NAME } from "@/content/navigation";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Bảng điều khiển khách hàng cho dịch vụ mạng xã hội, đơn hàng, ví và hỗ trợ."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
