import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { APP_NAME } from "@/content/navigation";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Customer dashboard for social media services, orders, wallet and support."
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
