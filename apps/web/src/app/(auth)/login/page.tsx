"use client";

import { useState } from "react";
import { getSession } from "next-auth/react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const nextErrors = { email: validEmail(email), password: password ? "" : "Vui lòng nhập mật khẩu." };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;
    setSubmitting(true);
    try {
      await customerService.login(email.trim(), password);
      const session = await getSession();
      const params = typeof globalThis.location !== "undefined" ? new URLSearchParams(globalThis.location.search) : null;
      const callbackUrl = params?.get("callbackUrl") ?? "";
      const isAdmin = session?.user?.role === "ADMIN";
      const safeCallback = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "";
      const destination = safeCallback && (isAdmin ? safeCallback.startsWith("/admin") : !safeCallback.startsWith("/admin"))
        ? safeCallback
        : isAdmin ? "/admin" : "/dashboard";
      toast({ tone: "success", title: "Đăng nhập thành công" });
      router.push(destination);
    } catch (reason) {
      toast({ tone: "error", title: "Đăng nhập thất bại", description: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally { setSubmitting(false); }
  }

  return <AuthShell title="Đăng nhập" description="Truy cập khu vực khách hàng hoặc quản trị theo quyền tài khoản." footer={<span>Chưa có tài khoản? <Link className="text-link" href="/register">Đăng ký</Link></span>}><div className="auth-form"><Input label="Email" type="email" autoComplete="email" value={email} error={errors.email} onChange={(event) => { setEmail(event.currentTarget.value); setErrors((current) => ({ ...current, email: undefined })); }} /><Input label="Mật khẩu" type="password" autoComplete="current-password" value={password} error={errors.password} onChange={(event) => { setPassword(event.currentTarget.value); setErrors((current) => ({ ...current, password: undefined })); }} /><div className="auth-form__row"><span className="muted-text">Phiên đăng nhập được bảo vệ bằng cookie HttpOnly.</span><Link href="/forgot-password" className="text-link">Quên mật khẩu?</Link></div><Button size="lg" className="full-width" onClick={submit} loading={submitting}>Đăng nhập</Button></div></AuthShell>;
}
