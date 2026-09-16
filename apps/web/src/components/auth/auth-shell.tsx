import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/layout/sidebar";
import { CheckCircleIcon, LockIcon, SupportIcon } from "@/components/ui/icons";

export function AuthShell({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-page__brand-panel" aria-label="Tương Tác Pro">
        <div className="auth-page__brand-head"><BrandMark /></div>
        <div className="auth-page__brand-copy"><span className="auth-kicker">T\u01b0\u01a1ng T\u00e1c Pro</span><h1>Quản lý dịch vụ mạng xã hội trên một giao diện rõ ràng.</h1><p>Theo dõi số dư, đơn hàng và hỗ trợ trên cùng một tài khoản.</p></div>
        <div className="auth-benefits"><div><CheckCircleIcon size={18} /><span>Giá và giới hạn dịch vụ minh bạch</span></div><div><LockIcon size={18} /><span>Thông tin tài khoản và dữ liệu giao dịch được bảo vệ</span></div><div><SupportIcon size={18} /><span>Yêu cầu hỗ trợ được gắn trực tiếp với tài khoản</span></div></div>
      </section>
      <section className="auth-page__form-panel">
        <div className="auth-card-wrap">
          <Link href="/" className="auth-mobile-brand"><BrandMark /></Link>
          <div className="auth-heading"><h2>{title}</h2><p>{description}</p></div>
          {children}
          {footer ? <div className="auth-footer">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}
