"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { customerService } from "@/services/customer-service";
import { validEmail, validPassword } from "@/validation/customer";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string; accepted?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const nextErrors = {
      name: name.trim() ? "" : "Vui lòng nhập họ tên.",
      email: validEmail(email),
      password: validPassword(password),
      confirm: password === confirm ? "" : "Xác nhận mật khẩu không khớp.",
      accepted: accepted ? "" : "Bạn cần đồng ý điều khoản trước khi đăng ký."
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    setSubmitting(true);
    try {
      await customerService.register(name.trim(), email.trim(), password);
      toast({ tone: "success", title: "Đã tạo tài khoản", description: "Tài khoản đã được tạo thành công." });
      router.push("/dashboard");
    } catch (reason) {
      toast({ tone: "error", title: "Đăng ký thất bại", description: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally { setSubmitting(false); }
  }

  return <AuthShell title="Tạo tài khoản" description="Đăng ký để sử dụng dịch vụ và theo dõi đơn hàng." footer={<span>Đã có tài khoản? <Link className="text-link" href="/login">Đăng nhập</Link></span>}><div className="auth-form"><Input label="Họ và tên" autoComplete="name" value={name} error={errors.name} onChange={(event) => { setName(event.currentTarget.value); setErrors((current) => ({ ...current, name: undefined })); }} /><Input label="Email" type="email" autoComplete="email" value={email} error={errors.email} onChange={(event) => { setEmail(event.currentTarget.value); setErrors((current) => ({ ...current, email: undefined })); }} /><Input label="Mật khẩu" type="password" autoComplete="new-password" value={password} error={errors.password} onChange={(event) => { setPassword(event.currentTarget.value); setErrors((current) => ({ ...current, password: undefined })); }} /><Input label="Xác nhận mật khẩu" type="password" autoComplete="new-password" value={confirm} error={errors.confirm} onChange={(event) => { setConfirm(event.currentTarget.value); setErrors((current) => ({ ...current, confirm: undefined })); }} /><label className="checkbox-row checkbox-row--stack"><input type="checkbox" checked={accepted} onChange={(event: { currentTarget: { checked: boolean } }) => { setAccepted(event.currentTarget.checked); setErrors((current) => ({ ...current, accepted: undefined })); }} /><span>Tôi đồng ý với điều khoản dịch vụ và chính sách bảo mật.</span></label>{errors.accepted ? <span className="field-error" role="alert">{errors.accepted}</span> : null}<Button size="lg" className="full-width" onClick={submit} loading={submitting}>Đăng ký</Button></div></AuthShell>;
}
