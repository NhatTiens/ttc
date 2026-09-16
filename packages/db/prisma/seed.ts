import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import argon2 from "argon2";
import { getDb } from "../src/client";
import { DepositStatus, OrderStatus, SocialPlatform, ServiceStatus, SupportSenderType, SupportTicketStatus, UserRole, UserStatus, DepositMethodType, WalletTransactionStatus, WalletTransactionType } from "../generated/prisma/client";

const rootEnvPath = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(rootEnvPath)) process.loadEnvFile(rootEnvPath);

const db = getDb();

const categories = [
  ["followers", "Người theo dõi", 10],
  ["likes", "Lượt thích / Cảm xúc", 20],
  ["views", "Lượt xem", 30],
  ["comments", "Bình luận", 40],
  ["shares", "Chia sẻ", 50]
] as const;

const services = [
  ["svc_fb_follow_01", "FB-FOLLOW-01", SocialPlatform.FACEBOOK, "followers", "Người theo dõi Facebook - Tiêu chuẩn", "Tăng người theo dõi ổn định cho trang cá nhân và fanpage công khai.", 32000n, 100, 100000, "0–24 giờ", ServiceStatus.ACTIVE, true],
  ["svc_fb_like_01", "FB-LIKE-01", SocialPlatform.FACEBOOK, "likes", "Lượt thích bài viết Facebook", "Tăng lượt thích và cảm xúc cho bài viết Facebook công khai.", 18000n, 50, 50000, "0–6 giờ", ServiceStatus.ACTIVE, true],
  ["svc_fb_comment_01", "FB-CMT-01", SocialPlatform.FACEBOOK, "comments", "Bình luận Facebook tùy chỉnh", "Bình luận theo nội dung tùy chỉnh được gửi cùng đơn hàng.", 145000n, 10, 2000, "0–24 giờ", ServiceStatus.DISABLED, false],
  ["svc_tt_follow_01", "TT-FOLLOW-01", SocialPlatform.TIKTOK, "followers", "Người theo dõi TikTok - Nhanh", "Tăng người theo dõi nhanh, hỗ trợ bù dần theo cấu hình.", 29000n, 100, 200000, "0–12 giờ", ServiceStatus.ACTIVE, true],
  ["svc_tt_like_01", "TT-LIKE-01", SocialPlatform.TIKTOK, "likes", "Lượt thích video TikTok", "Tăng lượt thích cho video TikTok công khai.", 9500n, 100, 500000, "0–4 giờ", ServiceStatus.ACTIVE, true],
  ["svc_tt_view_01", "TT-VIEW-01", SocialPlatform.TIKTOK, "views", "Lượt xem video TikTok", "Tăng lượt xem số lượng lớn cho video TikTok công khai.", 1800n, 1000, 5000000, "0–3 giờ", ServiceStatus.ACTIVE, true],
  ["svc_ig_follow_01", "IG-FOLLOW-01", SocialPlatform.INSTAGRAM, "followers", "Người theo dõi Instagram", "Tăng người theo dõi cho tài khoản Instagram công khai.", 42000n, 100, 100000, "0–24 giờ", ServiceStatus.ACTIVE, false],
  ["svc_ig_like_01", "IG-LIKE-01", SocialPlatform.INSTAGRAM, "likes", "Lượt thích bài viết Instagram", "Tăng lượt thích cho bài viết và Reels công khai.", 12000n, 50, 100000, "0–6 giờ", ServiceStatus.ACTIVE, false],
  ["svc_ig_view_01", "IG-VIEW-01", SocialPlatform.INSTAGRAM, "views", "Lượt xem Instagram Reels", "Tăng lượt xem cho Instagram Reels công khai.", 4500n, 500, 1000000, "0–12 giờ", ServiceStatus.MAINTENANCE, false],
  ["svc_yt_sub_01", "YT-SUB-01", SocialPlatform.YOUTUBE, "followers", "Người đăng ký YouTube", "Tăng người đăng ký cho kênh YouTube công khai.", 168000n, 50, 50000, "1–3 ngày", ServiceStatus.ACTIVE, false],
  ["svc_yt_view_01", "YT-VIEW-01", SocialPlatform.YOUTUBE, "views", "Lượt xem video YouTube", "Tăng lượt xem cho video YouTube công khai.", 26000n, 500, 1000000, "0–48 giờ", ServiceStatus.ACTIVE, false],
  ["svc_th_follow_01", "TH-FOLLOW-01", SocialPlatform.THREADS, "followers", "Người theo dõi Threads", "Tăng người theo dõi cho tài khoản Threads công khai.", 56000n, 100, 50000, "0–24 giờ", ServiceStatus.ACTIVE, false],
  ["svc_th_like_01", "TH-LIKE-01", SocialPlatform.THREADS, "likes", "Lượt thích bài viết Threads", "Tăng lượt thích cho bài viết Threads công khai.", 17000n, 50, 50000, "0–8 giờ", ServiceStatus.ACTIVE, false]
] as const;

async function main() {
  for (const [id, name, sortOrder] of categories) {
    await db.serviceCategory.upsert({ where: { id }, update: { name, sortOrder }, create: { id, name, sortOrder } });
  }
  for (const [id, code, platform, categoryId, name, description, ratePerThousandMinor, min, max, averageTime, status, popular] of services) {
    await db.service.upsert({
      where: { id },
      update: { code, platform, categoryId, name, description, ratePerThousandMinor, min, max, averageTime, status, popular },
      create: { id, code, platform, categoryId, name, description, ratePerThousandMinor, min, max, averageTime, status, popular }
    });
  }

  const depositMethods = [
    {
      id: "bank-transfer", name: "Chuyển khoản ngân hàng", type: DepositMethodType.BANK,
      description: "Chuyển khoản đến tài khoản ngân hàng đã cấu hình và sử dụng đúng nội dung chuyển khoản được tạo.",
      minMinor: 50000n, maxMinor: 50000000n, feeLabel: "Không có phí nền tảng", enabled: true,
      instructions: ["Tạo yêu cầu nạp tiền.", "Chuyển đúng số tiền và dùng nội dung chuyển khoản được tạo.", "Yêu cầu ở trạng thái đang chờ cho đến khi được xác nhận."]
    },
    {
      id: "vietqr", name: "VietQR", type: DepositMethodType.QR,
      description: "Tạo yêu cầu thanh toán bằng mã QR theo cấu hình hiện tại.",
      minMinor: 50000n, maxMinor: 20000000n, feeLabel: "Sẽ cấu hình sau", enabled: true,
      instructions: ["Chọn số tiền cần nạp.", "Mã QR sẽ được tạo từ cấu hình thanh toán ở Work payment sau.", "Xác nhận tự động hiện chưa khả dụng."]
    },
    {
      id: "manual-review", name: "Duyệt thủ công", type: DepositMethodType.MANUAL,
      description: "Chỉ sử dụng khi có hướng dẫn từ bộ phận hỗ trợ.",
      minMinor: 100000n, maxMinor: 10000000n, feeLabel: "Không thu phí", enabled: false,
      instructions: ["Liên hệ bộ phận hỗ trợ trước khi sử dụng phương thức này."]
    }
  ];
  for (const method of depositMethods) {
    await db.depositMethod.upsert({ where: { id: method.id }, update: method, create: method });
  }

  await db.systemSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "Tương Tác Pro",
      supportEmail: "support@example.com",
      maintenanceMode: false,
      minimumDepositMinor: 50000n,
      orderCreationEnabled: true,
      supportEnabled: true
    }
  });

  if (process.env.SEED_DEVELOPMENT_ACCOUNT !== "false") {
    const email = (process.env.SEED_DEVELOPMENT_EMAIL ?? "minh@example.com").trim().toLowerCase();
    const password = process.env.SEED_DEVELOPMENT_PASSWORD ?? "demo1234";
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await db.user.upsert({
      where: { email },
      update: { name: "Nguyễn Minh", passwordHash, status: UserStatus.ACTIVE, role: UserRole.CUSTOMER },
      create: { email, passwordHash, name: "Nguyễn Minh", phone: "0901234567", status: UserStatus.ACTIVE, role: UserRole.CUSTOMER }
    });
    await db.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, orderUpdates: true, walletUpdates: true, promotions: false, supportReplies: true }
    });
    const wallet = await db.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, balanceMinor: 0n, reservedMinor: 0n, currency: "VND" }
    });
    const seedKey = "seed:development-opening-balance";
    const openingBalance = 1250000n;
    const existingSeedCredit = await db.walletTransaction.findUnique({
      where: { walletId_idempotencyKey: { walletId: wallet.id, idempotencyKey: seedKey } }
    });
    if (!existingSeedCredit) {
      await db.$transaction(async (tx) => {
        const current = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
        await tx.wallet.update({ where: { id: wallet.id }, data: { balanceMinor: { increment: openingBalance } } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: WalletTransactionType.ADJUSTMENT,
            status: WalletTransactionStatus.COMPLETED,
            amountMinor: openingBalance,
            balanceBeforeMinor: current.balanceMinor,
            balanceAfterMinor: current.balanceMinor + openingBalance,
            referenceType: "SEED",
            referenceId: "development-opening-balance",
            description: "Số dư khởi tạo tài khoản development",
            idempotencyKey: seedKey
          }
        });
      });
    }

    const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").trim().toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234";
    const adminPasswordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });
    await db.user.upsert({
      where: { email: adminEmail },
      update: { name: "Tương Tác Pro Admin", passwordHash: adminPasswordHash, status: UserStatus.ACTIVE, role: UserRole.ADMIN },
      create: { email: adminEmail, passwordHash: adminPasswordHash, name: "Tương Tác Pro Admin", status: UserStatus.ACTIVE, role: UserRole.ADMIN }
    });

    const secondEmail = (process.env.SEED_DEVELOPMENT_SECOND_EMAIL ?? "lan@example.com").trim().toLowerCase();
    const secondPassword = process.env.SEED_DEVELOPMENT_SECOND_PASSWORD ?? "demo1234";
    const secondHash = await argon2.hash(secondPassword, { type: argon2.argon2id });
    const secondUser = await db.user.upsert({
      where: { email: secondEmail },
      update: { name: "Trần Lan", passwordHash: secondHash, status: UserStatus.ACTIVE, role: UserRole.CUSTOMER },
      create: { email: secondEmail, passwordHash: secondHash, name: "Trần Lan", phone: "0902222333", status: UserStatus.ACTIVE, role: UserRole.CUSTOMER }
    });
    await db.notificationPreference.upsert({
      where: { userId: secondUser.id },
      update: {},
      create: { userId: secondUser.id, orderUpdates: true, walletUpdates: true, promotions: false, supportReplies: true }
    });
    await db.wallet.upsert({ where: { userId: secondUser.id }, update: {}, create: { userId: secondUser.id, currency: "VND" } });

    const sampleOrderPublicId = "TT-SEED-0001";
    const existingOrder = await db.order.findUnique({ where: { publicId: sampleOrderPublicId } });
    if (!existingOrder) {
      await db.$transaction(async (tx) => {
        const currentWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
        const charge = 3200n;
        const order = await tx.order.create({
          data: {
            publicId: sampleOrderPublicId,
            userId: user.id,
            serviceId: "svc_fb_follow_01",
            targetUrl: "https://example.com/development-profile",
            quantity: 100,
            chargeMinor: charge,
            remaining: 100,
            status: OrderStatus.PENDING,
            idempotencyKey: "seed:sample-order",
            requestFingerprint: "seed-sample-order"
          }
        });
        await tx.wallet.update({ where: { id: wallet.id }, data: { balanceMinor: { decrement: charge } } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id, type: WalletTransactionType.PURCHASE, status: WalletTransactionStatus.COMPLETED, amountMinor: -charge,
            balanceBeforeMinor: currentWallet.balanceMinor, balanceAfterMinor: currentWallet.balanceMinor - charge, referenceType: "ORDER",
            referenceId: sampleOrderPublicId, description: `Đơn hàng development ${sampleOrderPublicId}`, idempotencyKey: "seed:sample-order-purchase"
          }
        });
        await tx.orderLog.create({ data: { orderId: order.id, toStatus: OrderStatus.PENDING, message: "Đơn mẫu development đang chờ xử lý." } });
      });
    }

    const sampleDepositPublicId = "DEP-SEED-0001";
    if (!await db.deposit.findUnique({ where: { publicId: sampleDepositPublicId } })) {
      await db.$transaction(async (tx) => {
        const currentWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
        await tx.deposit.create({
          data: { publicId: sampleDepositPublicId, userId: user.id, methodId: "bank-transfer", amountMinor: 200000n, status: DepositStatus.PENDING, idempotencyKey: "seed:sample-deposit" }
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id, type: WalletTransactionType.DEPOSIT, status: WalletTransactionStatus.PENDING, amountMinor: 200000n,
            balanceBeforeMinor: currentWallet.balanceMinor, balanceAfterMinor: currentWallet.balanceMinor, referenceType: "DEPOSIT",
            referenceId: sampleDepositPublicId, description: `Yêu cầu nạp tiền development ${sampleDepositPublicId}`, idempotencyKey: "seed:sample-deposit-ledger"
          }
        });
      });
    }

    const sampleTicketPublicId = "SUP-SEED-0001";
    if (!await db.supportTicket.findUnique({ where: { publicId: sampleTicketPublicId } })) {
      await db.supportTicket.create({
        data: {
          publicId: sampleTicketPublicId, userId: user.id, subject: "Yêu cầu hỗ trợ development", category: "general", status: SupportTicketStatus.WAITING_SUPPORT,
          messages: { create: { senderType: SupportSenderType.CUSTOMER, senderUserId: user.id, body: "Đây là yêu cầu hỗ trợ mẫu dùng cho Work 05 development." } }
        }
      });
    }
  }
}

main()
  .then(async () => { await db.$disconnect(); })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exitCode = 1;
  });
