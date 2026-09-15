"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { customerService } from "@/services/customer-service";
import { validEmail } from "@/validation/customer";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("minh@example.com");
  const [password, setPassword] = useState("demo1234");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const nextErrors = { email: validEmail(email), password: password ? "" : "Vui lòng nhập mật khẩu." };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;
    setSubmitting(true);
    try {
      await customerService.login(email.trim(), password);
      toast({ tone: "success", title: "Signed in", description: remember ? "This device is marked as remembered in the mock UI." : undefined });
      router.push("/dashboard");
    } catch (reason) {
      toast({ tone: "error", title: "Sign in failed", description: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally { setSubmitting(false); }
  }

  return <AuthShell title="Đăng nhập" description="Truy cập dashboard khách hàng của bạn." footer={<span>Chưa có tài khoản? <Link className="text-link" href="/register">Đăng ký</Link></span>}><div className="auth-form"><Input label="Email" type="email" autoComplete="email" value={email} error={errors.email} onChange={(event) => { setEmail(event.currentTarget.value); setErrors((current) => ({ ...current, email: undefined })); }} /><Input label="Password" type="password" autoComplete="current-password" value={password} error={errors.password} onChange={(event) => { setPassword(event.currentTarget.value); setErrors((current) => ({ ...current, password: undefined })); }} /><div className="auth-form__row"><label className="checkbox-row"><input type="checkbox" checked={remember} onChange={(event: { currentTarget: { checked: boolean } }) => setRemember(event.currentTarget.checked)} /><span>Ghi nhớ đăng nhập</span></label><Link href="/forgot-password" className="text-link">Quên mật khẩu?</Link></div><Button size="lg" className="full-width" onClick={submit} loading={submitting}>Đăng nhập</Button><p className="auth-demo-note">Mock login: bạn có thể dùng email và mật khẩu đang hiển thị để vào customer app.</p></div></AuthShell>;
}
