export function required(value: string, label: string) {
  return value.trim() ? "" : `${label} là bắt buộc.`;
}

export function validEmail(value: string) {
  if (!value.trim()) return "Vui lòng nhập email.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Email chưa đúng định dạng.";
}

export function validUrl(value: string) {
  if (!value.trim()) return "Vui lòng nhập link.";
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? "" : "Link phải bắt đầu bằng http:// hoặc https://.";
  } catch {
    return "Vui lòng nhập link hợp lệ, bao gồm https://.";
  }
}

export function validPassword(value: string) {
  if (value.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Mật khẩu phải có ít nhất một chữ cái và một chữ số.";
  return "";
}
