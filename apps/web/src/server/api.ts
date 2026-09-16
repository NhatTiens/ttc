import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "@tuong-tac-pro/domain";

export function apiData<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function apiHandler(operation: () => Promise<Response>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof DomainError) return apiError(error.code, error.message, error.status);
    if (error instanceof ZodError) return apiError("VALIDATION_ERROR", "Dữ liệu gửi lên chưa hợp lệ.", 400);
    console.error("Unhandled API error", error);
    return apiError("INTERNAL_ERROR", "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.", 500);
  }
}

export async function parseJson(request: Request) {
  try {
    return await request.json() as unknown;
  } catch {
    throw new DomainError("VALIDATION_ERROR", "Nội dung JSON không hợp lệ.", 400);
  }
}

export function requireIdempotencyKey(request: Request) {
  const key = request.headers.get("Idempotency-Key")?.trim() ?? "";
  if (key.length < 8 || key.length > 128) {
    throw new DomainError("VALIDATION_ERROR", "Thiếu hoặc sai định dạng Idempotency-Key.", 400);
  }
  return key;
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return;
  const expectedOrigin = new URL(request.url).origin;
  if (origin !== expectedOrigin) {
    throw new DomainError("FORBIDDEN", "Nguồn yêu cầu không hợp lệ.", 403);
  }
}
