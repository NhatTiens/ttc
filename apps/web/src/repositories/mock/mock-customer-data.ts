import type { CustomerProfile, DepositMethod, Order, Service, ServiceCategory, SupportMessage, SupportTicket, Wallet, WalletTransaction } from "@/domain/customer";

export const mockProfile: CustomerProfile = {
  id: "usr_001",
  name: "Nguyễn Minh",
  email: "minh@example.com",
  phone: "0901234567",
  joinedAt: "2026-05-12T09:15:00+07:00",
  security: { twoFactorEnabled: false, lastPasswordChange: "2026-08-20T10:30:00+07:00" },
  notifications: { orderUpdates: true, walletUpdates: true, promotions: false, supportReplies: true }
};

export const mockWallet: Wallet = { balance: 1250000, currency: "VND" };

export const mockCategories: ServiceCategory[] = [
  { id: "followers", name: "Người theo dõi" },
  { id: "likes", name: "Lượt thích / Cảm xúc" },
  { id: "views", name: "Lượt xem" },
  { id: "comments", name: "Bình luận" },
  { id: "shares", name: "Chia sẻ" }
];

export const mockServices: Service[] = [
  { id: "svc_fb_follow_01", code: "FB-FOLLOW-01", platform: "facebook", category: "followers", name: "Người theo dõi Facebook - Tiêu chuẩn", description: "Tăng người theo dõi ổn định cho trang cá nhân và fanpage công khai.", ratePerThousand: 32000, min: 100, max: 100000, status: "Active", averageTime: "0–24 giờ", popular: true },
  { id: "svc_fb_like_01", code: "FB-LIKE-01", platform: "facebook", category: "likes", name: "Lượt thích bài viết Facebook", description: "Tăng lượt thích và cảm xúc cho bài viết Facebook công khai.", ratePerThousand: 18000, min: 50, max: 50000, status: "Active", averageTime: "0–6 giờ", popular: true },
  { id: "svc_fb_comment_01", code: "FB-CMT-01", platform: "facebook", category: "comments", name: "Bình luận Facebook tùy chỉnh", description: "Bình luận theo nội dung tùy chỉnh được gửi cùng đơn hàng.", ratePerThousand: 145000, min: 10, max: 2000, status: "Paused", averageTime: "0–24 giờ" },
  { id: "svc_tt_follow_01", code: "TT-FOLLOW-01", platform: "tiktok", category: "followers", name: "Người theo dõi TikTok - Nhanh", description: "Tăng người theo dõi nhanh, hỗ trợ bù dần theo cấu hình.", ratePerThousand: 29000, min: 100, max: 200000, status: "Active", averageTime: "0–12 giờ", popular: true },
  { id: "svc_tt_like_01", code: "TT-LIKE-01", platform: "tiktok", category: "likes", name: "Lượt thích video TikTok", description: "Tăng lượt thích cho video TikTok công khai.", ratePerThousand: 9500, min: 100, max: 500000, status: "Active", averageTime: "0–4 giờ", popular: true },
  { id: "svc_tt_view_01", code: "TT-VIEW-01", platform: "tiktok", category: "views", name: "Lượt xem video TikTok", description: "Tăng lượt xem số lượng lớn cho video TikTok công khai.", ratePerThousand: 1800, min: 1000, max: 5000000, status: "Active", averageTime: "0–3 giờ", popular: true },
  { id: "svc_ig_follow_01", code: "IG-FOLLOW-01", platform: "instagram", category: "followers", name: "Người theo dõi Instagram", description: "Tăng người theo dõi cho tài khoản Instagram công khai.", ratePerThousand: 42000, min: 100, max: 100000, status: "Active", averageTime: "0–24 giờ" },
  { id: "svc_ig_like_01", code: "IG-LIKE-01", platform: "instagram", category: "likes", name: "Lượt thích bài viết Instagram", description: "Tăng lượt thích cho bài viết và Reels công khai.", ratePerThousand: 12000, min: 50, max: 100000, status: "Active", averageTime: "0–6 giờ" },
  { id: "svc_ig_view_01", code: "IG-VIEW-01", platform: "instagram", category: "views", name: "Lượt xem Instagram Reels", description: "Tăng lượt xem cho Instagram Reels công khai.", ratePerThousand: 4500, min: 500, max: 1000000, status: "Maintenance", averageTime: "0–12 giờ" },
  { id: "svc_yt_sub_01", code: "YT-SUB-01", platform: "youtube", category: "followers", name: "Người đăng ký YouTube", description: "Tăng người đăng ký cho kênh YouTube công khai.", ratePerThousand: 168000, min: 50, max: 50000, status: "Active", averageTime: "1–3 ngày" },
  { id: "svc_yt_view_01", code: "YT-VIEW-01", platform: "youtube", category: "views", name: "Lượt xem video YouTube", description: "Tăng lượt xem cho video YouTube công khai.", ratePerThousand: 26000, min: 500, max: 1000000, status: "Active", averageTime: "0–48 giờ" },
  { id: "svc_th_follow_01", code: "TH-FOLLOW-01", platform: "threads", category: "followers", name: "Người theo dõi Threads", description: "Tăng người theo dõi cho tài khoản Threads công khai.", ratePerThousand: 56000, min: 100, max: 50000, status: "Active", averageTime: "0–24 giờ" },
  { id: "svc_th_like_01", code: "TH-LIKE-01", platform: "threads", category: "likes", name: "Lượt thích bài viết Threads", description: "Tăng lượt thích cho bài viết Threads công khai.", ratePerThousand: 17000, min: 50, max: 50000, status: "Active", averageTime: "0–8 giờ" }
];

export const mockOrders: Order[] = [
  { id: "TT260915-1042", serviceId: "svc_tt_follow_01", serviceName: "Người theo dõi TikTok - Nhanh", platform: "tiktok", targetUrl: "https://tiktok.com/@demo", quantity: 5000, startCount: 12400, charge: 145000, remaining: 1200, status: "Processing", createdAt: "2026-09-15T21:20:00+07:00", updatedAt: "2026-09-15T23:45:00+07:00" },
  { id: "TT260914-0978", serviceId: "svc_fb_like_01", serviceName: "Lượt thích bài viết Facebook", platform: "facebook", targetUrl: "https://facebook.com/demo/posts/123", quantity: 3000, startCount: 228, charge: 54000, remaining: 0, status: "Completed", createdAt: "2026-09-14T14:10:00+07:00", updatedAt: "2026-09-14T16:35:00+07:00" },
  { id: "TT260913-0911", serviceId: "svc_yt_view_01", serviceName: "Lượt xem video YouTube", platform: "youtube", targetUrl: "https://youtube.com/watch?v=demo", quantity: 10000, startCount: 5430, charge: 260000, remaining: 0, status: "Completed", createdAt: "2026-09-13T09:00:00+07:00", updatedAt: "2026-09-14T08:15:00+07:00" },
  { id: "TT260912-0874", serviceId: "svc_ig_follow_01", serviceName: "Người theo dõi Instagram", platform: "instagram", targetUrl: "https://instagram.com/demo", quantity: 2000, startCount: 8840, charge: 84000, remaining: 300, status: "Partial", createdAt: "2026-09-12T19:40:00+07:00", updatedAt: "2026-09-13T07:10:00+07:00" },
  { id: "TT260911-0795", serviceId: "svc_tt_view_01", serviceName: "Lượt xem video TikTok", platform: "tiktok", targetUrl: "https://tiktok.com/@demo/video/456", quantity: 50000, startCount: 910, charge: 90000, remaining: 0, status: "Completed", createdAt: "2026-09-11T11:25:00+07:00", updatedAt: "2026-09-11T12:50:00+07:00" },
  { id: "TT260909-0654", serviceId: "svc_th_follow_01", serviceName: "Người theo dõi Threads", platform: "threads", targetUrl: "https://threads.net/@demo", quantity: 1000, charge: 56000, remaining: 1000, status: "Cancelled", createdAt: "2026-09-09T10:05:00+07:00", updatedAt: "2026-09-09T10:20:00+07:00" },
  { id: "TT260907-0511", serviceId: "svc_fb_follow_01", serviceName: "Người theo dõi Facebook - Tiêu chuẩn", platform: "facebook", targetUrl: "https://facebook.com/demo", quantity: 4000, charge: 128000, remaining: 4000, status: "Refunded", createdAt: "2026-09-07T08:45:00+07:00", updatedAt: "2026-09-08T09:10:00+07:00" }
];

export const mockTransactions: WalletTransaction[] = [
  { id: "TXN-260915-01", type: "Purchase", description: "Đơn hàng TT260915-1042", amount: -145000, balanceAfter: 1250000, date: "2026-09-15T21:20:00+07:00", status: "Completed", reference: "TT260915-1042" },
  { id: "TXN-260915-00", type: "Deposit", description: "Nạp tiền qua chuyển khoản ngân hàng", amount: 1000000, balanceAfter: 1395000, date: "2026-09-15T10:15:00+07:00", status: "Completed", reference: "DEP-260915-02" },
  { id: "TXN-260914-02", type: "Purchase", description: "Đơn hàng TT260914-0978", amount: -54000, balanceAfter: 395000, date: "2026-09-14T14:10:00+07:00", status: "Completed", reference: "TT260914-0978" },
  { id: "TXN-260912-01", type: "Refund", description: "Hoàn tiền một phần TT260912-0874", amount: 12600, balanceAfter: 449000, date: "2026-09-13T07:15:00+07:00", status: "Completed", reference: "TT260912-0874" },
  { id: "TXN-260910-01", type: "Adjustment", description: "Điều chỉnh từ bộ phận hỗ trợ", amount: 20000, balanceAfter: 436400, date: "2026-09-10T16:30:00+07:00", status: "Completed" },
  { id: "TXN-260901-01", type: "Deposit", description: "Nạp tiền thủ công đang chờ duyệt", amount: 500000, balanceAfter: 416400, date: "2026-09-01T08:20:00+07:00", status: "Pending", reference: "DEP-260901-01" }
];

export const mockDepositMethods: DepositMethod[] = [
  { id: "bank-transfer", name: "Chuyển khoản ngân hàng", type: "bank", description: "Chuyển khoản đến tài khoản ngân hàng đã cấu hình và sử dụng đúng nội dung chuyển khoản được tạo.", min: 50000, max: 50000000, feeLabel: "Không có phí nền tảng", enabled: true, instructions: ["Tạo yêu cầu nạp tiền.", "Chuyển đúng số tiền và dùng nội dung chuyển khoản được tạo.", "Yêu cầu nạp tiền ở trạng thái đang chờ cho đến khi được xác nhận."] },
  { id: "vietqr", name: "VietQR", type: "qr", description: "Tạo yêu cầu thanh toán bằng mã QR theo cấu hình hiện tại.", min: 50000, max: 20000000, feeLabel: "Sẽ cấu hình sau", enabled: true, instructions: ["Chọn số tiền cần nạp.", "Mã QR sẽ được tạo từ cấu hình thanh toán.", "Xác nhận tự động hiện chưa khả dụng với phương thức này."] },
  { id: "manual-review", name: "Duyệt thủ công", type: "manual", description: "Chỉ sử dụng khi có hướng dẫn từ bộ phận hỗ trợ.", min: 100000, max: 10000000, feeLabel: "Không thu phí", enabled: false, instructions: ["Liên hệ bộ phận hỗ trợ trước khi sử dụng phương thức này."] }
];

export const mockTickets: SupportTicket[] = [
  { id: "SUP-260915-031", subject: "Đơn hàng vẫn đang xử lý", category: "Order", status: "Waiting", createdAt: "2026-09-15T20:30:00+07:00", updatedAt: "2026-09-15T22:15:00+07:00", lastMessage: "Chúng tôi đang kiểm tra trạng thái từ nhà cung cấp và sẽ cập nhật sớm." },
  { id: "SUP-260910-024", subject: "Hỏi về nội dung chuyển khoản", category: "Wallet", status: "Resolved", createdAt: "2026-09-10T09:10:00+07:00", updatedAt: "2026-09-10T10:05:00+07:00", lastMessage: "Yêu cầu nạp tiền của bạn đã được xác nhận thành công." }
];

export const mockSupportMessages: SupportMessage[] = [
  { id: "MSG-031-1", ticketId: "SUP-260915-031", sender: "customer", senderName: "Nguyễn Minh", body: "Đơn tăng người theo dõi TikTok của tôi vẫn đang xử lý. Bạn có thể kiểm tra trạng thái hiện tại giúp tôi không?", createdAt: "2026-09-15T20:30:00+07:00" },
  { id: "MSG-031-2", ticketId: "SUP-260915-031", sender: "admin", senderName: "Hỗ trợ Tương Tác Pro", body: "Chúng tôi đang kiểm tra trạng thái từ nhà cung cấp và sẽ cập nhật sớm.", createdAt: "2026-09-15T22:15:00+07:00" },
  { id: "MSG-024-1", ticketId: "SUP-260910-024", sender: "customer", senderName: "Nguyễn Minh", body: "Tôi đã ghi sai nội dung chuyển khoản. Khoản nạp này vẫn có thể được đối soát không?", createdAt: "2026-09-10T09:10:00+07:00" },
  { id: "MSG-024-2", ticketId: "SUP-260910-024", sender: "admin", senderName: "Hỗ trợ Tương Tác Pro", body: "Yêu cầu nạp tiền của bạn đã được xác nhận thành công.", createdAt: "2026-09-10T10:05:00+07:00" }
];
