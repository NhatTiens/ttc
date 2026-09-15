# Tương Tác Pro — Project Specification

## 1. Mục tiêu

Tương Tác Pro là hệ thống bán dịch vụ mạng xã hội theo mô hình reseller. Khách hàng sử dụng số dư nội bộ để đặt dịch vụ; backend chọn dịch vụ provider tương ứng, gửi đơn qua Provider Adapter, đồng bộ trạng thái và xử lý hoàn tiền khi cần.

Hệ thống phải được thiết kế cho production ngay từ nền móng: dữ liệu tiền không được cập nhật tùy tiện, mọi side effect quan trọng phải có idempotency, mọi hành động admin nhạy cảm phải có audit trail, frontend tuyệt đối không biết API key hoặc gọi trực tiếp external provider.

## 2. Phạm vi giai đoạn kiến trúc

### Trong phạm vi

- Kiến trúc frontend/backend/worker/provider.
- PostgreSQL data model và các invariant tài chính.
- REST API contract.
- Auth, RBAC, session strategy.
- Order/payment/wallet lifecycle.
- Dynamic pricing: provider price + markup = customer price.
- Queue/retry/idempotency/outbox/reconciliation.
- Provider adapter contract.
- Admin/customer route map.
- Security plan.
- Development plan và test gates.

### Ngoài phạm vi tại checkpoint này

- Thiết kế UI hoàn chỉnh.
- Tích hợp provider thật.
- Tích hợp payment gateway thật.
- Deploy production.
- Chọn branding/visual system cuối cùng.
- Migration dữ liệu legacy.

## 3. Người dùng hệ thống

### CUSTOMER

Có thể đăng ký, đăng nhập, xem dịch vụ, lấy báo giá, tạo đơn, theo dõi đơn, xem ví/giao dịch, tạo yêu cầu nạp tiền, nhận thông báo, tạo ticket và quản lý tài khoản.

### SUPPORT

Có thể xem user/order/ticket trong phạm vi hỗ trợ nhưng không được thay đổi giá, provider credential hoặc ghi có/ghi nợ ví.

### FINANCE

Có thể xử lý deposit/payment/refund/financial reconciliation theo permission được cấp.

### ADMIN

Quản lý người dùng, dịch vụ, provider, pricing, order, tài chính, cài đặt và audit.

## 4. Functional requirements

### Authentication & account

- Email/password ở v1; kiến trúc vẫn tương thích OAuth qua Auth.js `accounts`.
- Session có khả năng revoke.
- Email verification và password reset token.
- Admin bắt buộc 2FA trước production launch.
- User có trạng thái `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `CLOSED`.

### Service catalog

- Platform: Facebook, TikTok, Instagram, YouTube, Threads.
- Category có thể phân cấp.
- Internal `services` tách khỏi raw `provider_services`.
- Một internal service có thể route tới một hoặc nhiều provider service.
- Dịch vụ có min/max, unit, refill/cancel capability, mô tả, trạng thái.
- Service public chỉ hiển thị giá bán hiện hành, không lộ provider/cost.

### Pricing

Không hard-code giá trong frontend hoặc source.

Công thức chuẩn:

```text
providerCostRate = providerRate × fxRate
calculatedCustomerRate = providerCostRate × (1 + markupPercent/100) + fixedMarkup
customerRate = manualOverride ?? rounded(calculatedCustomerRate)
orderCharge = moneyRound(customerRate × quantity / rateUnit)
```

Ví dụ:

```text
providerRate = 15đ
markupPercent = 35
customerRate = 15 × 1.35 = 20.25đ
```

Mỗi lần provider price, FX rate, markup hoặc manual override thay đổi, hệ thống tạo một `service_price_version` mới. Đơn hàng không tham chiếu “giá hiện tại”; nó lưu snapshot/version tại thời điểm quote.

### Order

- Tạo quote trước khi create order.
- `POST /orders` bắt buộc `Idempotency-Key`.
- Backend xác thực quote, số dư khả dụng và giữ tiền (reservation) trong một transaction.
- Provider submission chạy async qua outbox + queue + worker.
- Không gọi provider bên trong DB transaction.
- Order phải có public ID riêng, không lộ UUID nội bộ nếu không cần.
- Mỗi transition phải ghi `order_logs`.

### Wallet

- PostgreSQL là source of truth.
- `wallets.balance_minor` là posted balance.
- `wallets.reserved_minor` là tiền đang giữ cho order chưa capture.
- Available balance = `balance_minor - reserved_minor`.
- Mọi posted credit/debit phải tạo immutable `wallet_transactions`.
- Không cho admin sửa trực tiếp `wallets.balance_minor`.
- Admin adjustment cũng phải đi qua transaction service, idempotency key và audit log.

### Deposit & payment

- `deposit` là yêu cầu nạp tiền của user.
- `payment` là payment attempt/record từ bank/gateway.
- Payment webhook phải verify signature, deduplicate event và xử lý trong DB transaction.
- Confirm payment chỉ credit wallet đúng một lần.
- Refund payment chỉ chuyển sang `REFUNDED` sau khi refund thật sự hoàn tất.

### Support

- User tạo ticket, reply, đóng/reopen theo policy.
- Support/admin reply.
- Mọi message có actor và timestamp.

## 5. Non-functional requirements

- Monetary correctness ưu tiên hơn latency.
- API state-changing phải idempotent khi có thể.
- Không có secret/provider credential ở browser bundle.
- Structured logging có `requestId`, `userId`, `orderId`, `paymentId`, `providerId` khi phù hợp.
- Readiness/liveness endpoint.
- Database migration có rollback/forward plan.
- Backup + restore test trước production.
- Time lưu UTC; UI convert timezone.
- Không dùng JavaScript floating point cho tiền/rate.
- Pagination cho mọi collection lớn.
- Mọi list admin có filter/sort phía server.

## 6. Business invariants bắt buộc

1. `wallet.balance_minor >= 0` trừ khi có chính sách credit line riêng (v1: không có).
2. `wallet.reserved_minor >= 0`.
3. `wallet.reserved_minor <= wallet.balance_minor`.
4. Một payment confirmation không thể tạo hơn một wallet credit.
5. Một order idempotency key của một user không thể tạo hơn một order.
6. Một quote chỉ được consume cho tối đa một order.
7. Một provider submission side effect không được blind-retry khi không có bằng chứng idempotent.
8. Order charge/provider cost/markup phải có snapshot lịch sử.
9. Wallet transaction đã `POSTED` không được sửa amount; sai phải bù bằng compensating transaction.
10. Provider secret không được trả về frontend hoặc ghi plaintext vào log.
11. Admin money action phải có actor + reason + audit log.
12. Queue có thể giao job nhiều lần; worker vẫn phải cho kết quả như xử lý một lần.

## 7. Order lifecycle

Public status:

```text
Created
  -> Validating
  -> Submitted
  -> Processing
  -> Completed
```

Terminal/alternate states:

```text
Created/Validating -> Failed
Created/Validating -> Cancelled
Submitted/Processing -> Cancelled   (chỉ sau provider confirmation/policy)
Submitted/Processing -> Partial
Submitted/Processing -> Failed      (provider-specific semantics)
Partial/Failed/Cancelled -> Refunded (chỉ khi full customer charge đã hoàn)
```

`Partial` có thể đã hoàn một phần nhưng vẫn giữ status `Partial`. `Refunded` được dùng cho full refund. Không ép status public phản ánh mọi trạng thái kỹ thuật; provider submission có sub-state riêng để xử lý `UNKNOWN`.

## 8. Payment lifecycle

```text
Pending -> Confirmed
Pending -> Failed
Confirmed -> Refunded
```

Không cho phép `Failed -> Confirmed` trừ khi gateway gửi một payment record mới hoặc finance workflow được thiết kế rõ ràng. Webhook đến trễ phải đi qua transition guard.

## 9. Definition of done cho checkpoint kiến trúc

Checkpoint được coi là đạt khi:

- 10 tài liệu kiến trúc được review.
- Schema có constraint/idempotency/audit cho money và orders.
- Tất cả routes/API endpoint chính đã được liệt kê.
- Provider adapter contract được chốt.
- Retry strategy phân biệt safe retry và unsafe retry.
- Security controls và risk register được chốt.
- Không có UI implementation hoặc provider integration thật.

**Checkpoint:** `ARCHITECTURE READY FOR REVIEW`
