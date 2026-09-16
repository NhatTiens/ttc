"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form-controls";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { UserAvatar } from "@/components/ui/identity";
import { useCustomerSession } from "@/components/customer/customer-session";
import type { CustomerProfile } from "@/domain/customer";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatDateTime } from "@/lib/format";
import { validEmail, validPassword } from "@/validation/customer";

function PersonalForm({ profile, onSaved }: { profile: CustomerProfile; onSaved: (profile: CustomerProfile) => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    const nextErrors = { name: name.trim() ? "" : "Vui lòng nhập họ tên.", email: validEmail(email) };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.email) return;
    setSaving(true);
    try {
      const updated = await customerService.updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      onSaved(updated);
      toast({ tone: "success", title: "Đã cập nhật hồ sơ" });
    } catch (reason) {
      toast({ tone: "error", title: "Không thể cập nhật hồ sơ", description: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally {
      setSaving(false);
    }
  }

  return <Card className="form-card"><div className="profile-identity"><UserAvatar name={name} size="lg" /><div><strong>{name}</strong><span>Khách hàng từ {formatDateTime(profile.joinedAt)}</span></div></div><div className="profile-form-grid"><Input label="Họ và tên" value={name} error={errors.name} onChange={(event) => { setName(event.currentTarget.value); setErrors((current) => ({ ...current, name: undefined })); }} /><Input label="Email" type="email" value={email} error={errors.email} onChange={(event) => { setEmail(event.currentTarget.value); setErrors((current) => ({ ...current, email: undefined })); }} /><Input label="Số điện thoại" value={phone} onChange={(event) => setPhone(event.currentTarget.value)} /></div><div className="form-actions"><Button onClick={save} loading={saving}>Lưu thay đổi</Button></div></Card>;
}

function SecurityForm({ profile, onReload }: { profile: CustomerProfile; onReload: () => void }) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function changePassword() {
    const passwordError = validPassword(nextPassword);
    if (!currentPassword) { setError("Vui lòng nhập mật khẩu hiện tại."); return; }
    if (passwordError) { setError(passwordError); return; }
    if (nextPassword !== confirmPassword) { setError("Xác nhận mật khẩu mới không khớp."); return; }
    setError("");
    setSaving(true);
    try {
      await customerService.changePassword(currentPassword, nextPassword);
      setCurrentPassword(""); setNextPassword(""); setConfirmPassword("");
      onReload();
      toast({ tone: "success", title: "Đã đổi mật khẩu" });
    } catch (reason) {
      toast({ tone: "error", title: "Không thể đổi mật khẩu", description: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally { setSaving(false); }
  }

  return <div className="profile-security-grid"><Card className="form-card"><h2>Đổi mật khẩu</h2><div className="form-stack"><Input label="Mật khẩu hiện tại" type="password" value={currentPassword} onChange={(event) => { setCurrentPassword(event.currentTarget.value); setError(""); }} /><Input label="Mật khẩu mới" type="password" value={nextPassword} onChange={(event) => { setNextPassword(event.currentTarget.value); setError(""); }} /><Input label="Xác nhận mật khẩu mới" type="password" value={confirmPassword} error={error} onChange={(event) => { setConfirmPassword(event.currentTarget.value); setError(""); }} /><div className="form-actions"><Button onClick={changePassword} loading={saving}>Cập nhật mật khẩu</Button></div></div></Card><Card className="security-card"><div><h2>Xác thực hai yếu tố</h2>{profile.security.twoFactorEnabled ? <Badge tone="green">Đã bật</Badge> : <Badge tone="amber">Chưa bật</Badge>}</div><p>Xác thực hai yếu tố giúp tăng bảo mật cho tài khoản. Tính năng này hiện chưa khả dụng.</p><span>Đổi mật khẩu lần cuối: {formatDateTime(profile.security.lastPasswordChange)}</span><Button variant="outline" disabled>Cấu hình 2FA</Button></Card></div>;
}

function NotificationForm({ profile, onSaved }: { profile: CustomerProfile; onSaved: (profile: CustomerProfile) => void }) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(profile.notifications);
  const [saving, setSaving] = useState(false);
  const items: Array<{ key: keyof CustomerProfile["notifications"]; title: string; description: string }> = [
    { key: "orderUpdates", title: "Cập nhật đơn hàng", description: "Thay đổi trạng thái, hoàn thành một phần, thất bại và hoàn tất." },
    { key: "walletUpdates", title: "Cập nhật ví", description: "Nạp tiền, hoàn tiền và điều chỉnh số dư." },
    { key: "supportReplies", title: "Phản hồi hỗ trợ", description: "Phản hồi mới từ bộ phận hỗ trợ." },
    { key: "promotions", title: "Khuyến mãi", description: "Thông báo dịch vụ và ưu đãi khuyến mãi." }
  ];

  async function save() {
    setSaving(true);
    try {
      const updated = await customerService.updateNotificationPreferences(preferences);
      onSaved(updated);
      toast({ tone: "success", title: "Đã lưu tùy chọn thông báo" });
    } catch (reason) {
      toast({ tone: "error", title: "Không thể lưu tùy chọn thông báo", description: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally { setSaving(false); }
  }

  return <Card className="form-card"><div className="notification-preferences">{items.map((item) => <label key={item.key} className="preference-row"><span><strong>{item.title}</strong><small>{item.description}</small></span><input type="checkbox" checked={preferences[item.key]} onChange={(event: { currentTarget: { checked: boolean } }) => setPreferences((current) => ({ ...current, [item.key]: event.currentTarget.checked }))} /></label>)}</div><div className="form-actions"><Button onClick={save} loading={saving}>Lưu tùy chọn</Button></div></Card>;
}

export default function ProfilePage() {
  const resource = useAsyncResource(() => customerService.getProfile());
  const { refresh: refreshSession } = useCustomerSession();
  const [profileOverride, setProfileOverride] = useState<CustomerProfile | null>(null);

  if (resource.loading) return <LoadingState label="Đang tải hồ sơ..." />;
  if (resource.error) return <ErrorState title="Không thể tải hồ sơ" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <ErrorState title="Không tìm thấy hồ sơ" description="Hồ sơ khách hàng hiện tại chưa khả dụng." />;
  const profile = profileOverride ?? resource.data;
  const handleSaved = (updated: CustomerProfile) => { setProfileOverride(updated); refreshSession(); };

  return <div className="customer-page"><PageHeader eyebrow="Tài khoản" title="Hồ sơ & bảo mật" description="Quản lý thông tin cá nhân, mật khẩu và tùy chọn thông báo." /><Tabs items={[{ value: "personal", label: "Thông tin cá nhân", content: <PersonalForm profile={profile} onSaved={handleSaved} /> }, { value: "security", label: "Bảo mật", content: <SecurityForm profile={profile} onReload={resource.reload} /> }, { value: "notifications", label: "Thông báo", content: <NotificationForm profile={profile} onSaved={handleSaved} /> }]} /></div>;
}
