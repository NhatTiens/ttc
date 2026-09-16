"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { customerService } from "@/services/customer-service";
import { validEmail } from "@/validation/customer";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const nextError = validEmail(email);
    setError(nextError);
    if (nextError) return;
    setSubmitting(true);
    try {
      await customerService.requestPasswordReset(email.trim());
      setSent(true);
      toast({ tone: "success", title: "Đã gửi yêu cầu đặt lại mật khẩu" });
    } catch (reason) {
      toast({ tone: "error", title: "Không thể gửi yêu cầu", description: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally { setSubmitting(false); }
  }

  return <AuthShell title="Quên mật khẩu" description="Nhập email đã đăng ký để tạo yêu cầu đặt lại mật khẩu." footer={<Link href="/login" className="text-link">Quay lại đăng nhập</Link>}>{sent ? <Card className="auth-success"><strong>Kiểm tra email của bạn</strong><p>Yêu cầu đặt lại mật khẩu đã được ghi nhận cho {email}. Vui lòng làm theo hướng dẫn trong email khi hệ thống gửi liên kết đặt lại mật khẩu.</p><Link href="/login" className="button button--primary button--md">Về đăng nhập</Link></Card> : <div className="auth-form"><Input label="Email" type="email" autoComplete="email" value={email} error={error} onChange={(event) => { setEmail(event.currentTarget.value); setError(""); }} placeholder="you@example.com" /><Button size="lg" className="full-width" onClick={submit} loading={submitting}>Gửi yêu cầu</Button></div>}</AuthShell>;
}
