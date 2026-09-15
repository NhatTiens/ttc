import type { CustomerProfile, DepositMethod, Order, Service, ServiceCategory, SupportMessage, SupportTicket, Wallet, WalletTransaction } from "@/domain/customer";

export const mockProfile: CustomerProfile = {
  id: "usr_001",
  name: "Nguyen Minh",
  email: "minh@example.com",
  phone: "0901234567",
  joinedAt: "2026-05-12T09:15:00+07:00",
  security: { twoFactorEnabled: false, lastPasswordChange: "2026-08-20T10:30:00+07:00" },
  notifications: { orderUpdates: true, walletUpdates: true, promotions: false, supportReplies: true }
};

export const mockWallet: Wallet = { balance: 1250000, currency: "VND" };

export const mockCategories: ServiceCategory[] = [
  { id: "followers", name: "Followers" },
  { id: "likes", name: "Likes / Reactions" },
  { id: "views", name: "Views" },
  { id: "comments", name: "Comments" },
  { id: "shares", name: "Shares" }
];

export const mockServices: Service[] = [
  { id: "svc_fb_follow_01", code: "FB-FOLLOW-01", platform: "facebook", category: "followers", name: "Facebook Followers - Standard", description: "Stable follower delivery for public profiles and pages.", ratePerThousand: 32000, min: 100, max: 100000, status: "Active", averageTime: "0-24h", popular: true },
  { id: "svc_fb_like_01", code: "FB-LIKE-01", platform: "facebook", category: "likes", name: "Facebook Post Likes", description: "Likes and reactions for public Facebook posts.", ratePerThousand: 18000, min: 50, max: 50000, status: "Active", averageTime: "0-6h", popular: true },
  { id: "svc_fb_comment_01", code: "FB-CMT-01", platform: "facebook", category: "comments", name: "Facebook Custom Comments", description: "Custom text comments submitted with the order.", ratePerThousand: 145000, min: 10, max: 2000, status: "Paused", averageTime: "0-24h" },
  { id: "svc_tt_follow_01", code: "TT-FOLLOW-01", platform: "tiktok", category: "followers", name: "TikTok Followers - Fast", description: "Fast follower delivery with gradual refill support.", ratePerThousand: 29000, min: 100, max: 200000, status: "Active", averageTime: "0-12h", popular: true },
  { id: "svc_tt_like_01", code: "TT-LIKE-01", platform: "tiktok", category: "likes", name: "TikTok Video Likes", description: "Likes for public TikTok video links.", ratePerThousand: 9500, min: 100, max: 500000, status: "Active", averageTime: "0-4h", popular: true },
  { id: "svc_tt_view_01", code: "TT-VIEW-01", platform: "tiktok", category: "views", name: "TikTok Video Views", description: "High-capacity views for public TikTok videos.", ratePerThousand: 1800, min: 1000, max: 5000000, status: "Active", averageTime: "0-3h", popular: true },
  { id: "svc_ig_follow_01", code: "IG-FOLLOW-01", platform: "instagram", category: "followers", name: "Instagram Followers", description: "Followers for public Instagram profiles.", ratePerThousand: 42000, min: 100, max: 100000, status: "Active", averageTime: "0-24h" },
  { id: "svc_ig_like_01", code: "IG-LIKE-01", platform: "instagram", category: "likes", name: "Instagram Post Likes", description: "Likes for public posts and reels.", ratePerThousand: 12000, min: 50, max: 100000, status: "Active", averageTime: "0-6h" },
  { id: "svc_ig_view_01", code: "IG-VIEW-01", platform: "instagram", category: "views", name: "Instagram Reels Views", description: "Views for public Instagram Reels.", ratePerThousand: 4500, min: 500, max: 1000000, status: "Maintenance", averageTime: "0-12h" },
  { id: "svc_yt_sub_01", code: "YT-SUB-01", platform: "youtube", category: "followers", name: "YouTube Subscribers", description: "Subscriber delivery for public YouTube channels.", ratePerThousand: 168000, min: 50, max: 50000, status: "Active", averageTime: "1-3 days" },
  { id: "svc_yt_view_01", code: "YT-VIEW-01", platform: "youtube", category: "views", name: "YouTube Video Views", description: "Views for public YouTube videos.", ratePerThousand: 26000, min: 500, max: 1000000, status: "Active", averageTime: "0-48h" },
  { id: "svc_th_follow_01", code: "TH-FOLLOW-01", platform: "threads", category: "followers", name: "Threads Followers", description: "Followers for public Threads profiles.", ratePerThousand: 56000, min: 100, max: 50000, status: "Active", averageTime: "0-24h" },
  { id: "svc_th_like_01", code: "TH-LIKE-01", platform: "threads", category: "likes", name: "Threads Post Likes", description: "Likes for public Threads posts.", ratePerThousand: 17000, min: 50, max: 50000, status: "Active", averageTime: "0-8h" }
];

export const mockOrders: Order[] = [
  { id: "TT260915-1042", serviceId: "svc_tt_follow_01", serviceName: "TikTok Followers - Fast", platform: "tiktok", targetUrl: "https://tiktok.com/@demo", quantity: 5000, startCount: 12400, charge: 145000, remaining: 1200, status: "Processing", createdAt: "2026-09-15T21:20:00+07:00", updatedAt: "2026-09-15T23:45:00+07:00" },
  { id: "TT260914-0978", serviceId: "svc_fb_like_01", serviceName: "Facebook Post Likes", platform: "facebook", targetUrl: "https://facebook.com/demo/posts/123", quantity: 3000, startCount: 228, charge: 54000, remaining: 0, status: "Completed", createdAt: "2026-09-14T14:10:00+07:00", updatedAt: "2026-09-14T16:35:00+07:00" },
  { id: "TT260913-0911", serviceId: "svc_yt_view_01", serviceName: "YouTube Video Views", platform: "youtube", targetUrl: "https://youtube.com/watch?v=demo", quantity: 10000, startCount: 5430, charge: 260000, remaining: 0, status: "Completed", createdAt: "2026-09-13T09:00:00+07:00", updatedAt: "2026-09-14T08:15:00+07:00" },
  { id: "TT260912-0874", serviceId: "svc_ig_follow_01", serviceName: "Instagram Followers", platform: "instagram", targetUrl: "https://instagram.com/demo", quantity: 2000, startCount: 8840, charge: 84000, remaining: 300, status: "Partial", createdAt: "2026-09-12T19:40:00+07:00", updatedAt: "2026-09-13T07:10:00+07:00" },
  { id: "TT260911-0795", serviceId: "svc_tt_view_01", serviceName: "TikTok Video Views", platform: "tiktok", targetUrl: "https://tiktok.com/@demo/video/456", quantity: 50000, startCount: 910, charge: 90000, remaining: 0, status: "Completed", createdAt: "2026-09-11T11:25:00+07:00", updatedAt: "2026-09-11T12:50:00+07:00" },
  { id: "TT260909-0654", serviceId: "svc_th_follow_01", serviceName: "Threads Followers", platform: "threads", targetUrl: "https://threads.net/@demo", quantity: 1000, charge: 56000, remaining: 1000, status: "Cancelled", createdAt: "2026-09-09T10:05:00+07:00", updatedAt: "2026-09-09T10:20:00+07:00" },
  { id: "TT260907-0511", serviceId: "svc_fb_follow_01", serviceName: "Facebook Followers - Standard", platform: "facebook", targetUrl: "https://facebook.com/demo", quantity: 4000, charge: 128000, remaining: 4000, status: "Refunded", createdAt: "2026-09-07T08:45:00+07:00", updatedAt: "2026-09-08T09:10:00+07:00" }
];

export const mockTransactions: WalletTransaction[] = [
  { id: "TXN-260915-01", type: "Purchase", description: "Order TT260915-1042", amount: -145000, balanceAfter: 1250000, date: "2026-09-15T21:20:00+07:00", status: "Completed", reference: "TT260915-1042" },
  { id: "TXN-260915-00", type: "Deposit", description: "Bank transfer deposit", amount: 1000000, balanceAfter: 1395000, date: "2026-09-15T10:15:00+07:00", status: "Completed", reference: "DEP-260915-02" },
  { id: "TXN-260914-02", type: "Purchase", description: "Order TT260914-0978", amount: -54000, balanceAfter: 395000, date: "2026-09-14T14:10:00+07:00", status: "Completed", reference: "TT260914-0978" },
  { id: "TXN-260912-01", type: "Refund", description: "Partial refund TT260912-0874", amount: 12600, balanceAfter: 449000, date: "2026-09-13T07:15:00+07:00", status: "Completed", reference: "TT260912-0874" },
  { id: "TXN-260910-01", type: "Adjustment", description: "Support adjustment", amount: 20000, balanceAfter: 436400, date: "2026-09-10T16:30:00+07:00", status: "Completed" },
  { id: "TXN-260901-01", type: "Deposit", description: "Manual deposit awaiting review", amount: 500000, balanceAfter: 416400, date: "2026-09-01T08:20:00+07:00", status: "Pending", reference: "DEP-260901-01" }
];

export const mockDepositMethods: DepositMethod[] = [
  { id: "bank-transfer", name: "Bank transfer", type: "bank", description: "Transfer to the configured bank account and use the generated reference.", min: 50000, max: 50000000, feeLabel: "No platform fee", enabled: true, instructions: ["Create a deposit request.", "Transfer the exact amount with the generated reference.", "The deposit remains pending until confirmation."] },
  { id: "vietqr", name: "VietQR", type: "qr", description: "Generate a configured QR payment request. Gateway integration is not enabled yet.", min: 50000, max: 20000000, feeLabel: "Configured later", enabled: true, instructions: ["Choose an amount.", "A QR request will be created from payment configuration.", "Automatic confirmation will be connected in a later backend phase."] },
  { id: "manual-review", name: "Manual review", type: "manual", description: "Use only when instructed by support.", min: 100000, max: 10000000, feeLabel: "No fee", enabled: false, instructions: ["Contact support before using this method."] }
];

export const mockTickets: SupportTicket[] = [
  { id: "SUP-260915-031", subject: "Order is still processing", category: "Order", status: "Waiting", createdAt: "2026-09-15T20:30:00+07:00", updatedAt: "2026-09-15T22:15:00+07:00", lastMessage: "We are checking the provider status and will update you shortly." },
  { id: "SUP-260910-024", subject: "Deposit reference question", category: "Wallet", status: "Resolved", createdAt: "2026-09-10T09:10:00+07:00", updatedAt: "2026-09-10T10:05:00+07:00", lastMessage: "Your deposit was confirmed successfully." }
];

export const mockSupportMessages: SupportMessage[] = [
  { id: "MSG-031-1", ticketId: "SUP-260915-031", sender: "customer", senderName: "Nguyen Minh", body: "My TikTok followers order is still processing. Could you check the current status?", createdAt: "2026-09-15T20:30:00+07:00" },
  { id: "MSG-031-2", ticketId: "SUP-260915-031", sender: "admin", senderName: "TTP Support", body: "We are checking the provider status and will update you shortly.", createdAt: "2026-09-15T22:15:00+07:00" },
  { id: "MSG-024-1", ticketId: "SUP-260910-024", sender: "customer", senderName: "Nguyen Minh", body: "I used the wrong transfer note. Can the deposit still be matched?", createdAt: "2026-09-10T09:10:00+07:00" },
  { id: "MSG-024-2", ticketId: "SUP-260910-024", sender: "admin", senderName: "TTP Support", body: "Your deposit was confirmed successfully.", createdAt: "2026-09-10T10:05:00+07:00" }
];
