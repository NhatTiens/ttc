import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");

const { TTCProviderAdapter } = await import("../packages/providers/src/index.ts");
const {
  applyProviderServiceSync,
  setProviderEnabled,
  upsertServiceProviderMapping
} = await import("../packages/domain/src/index.ts");
const {
  disconnectDb,
  getDb,
  ProviderMappingStatus,
  ServiceStatus,
  SocialPlatform,
  UserRole,
  UserStatus
} = await import("../packages/db/src/index.ts");

const APPLY = process.argv.includes("--apply");
console.log("WORK 06 TTC mapping V2.2" + (APPLY ? " -- APPLY" : " -- DRY RUN"));
const db = getDb();

const CATALOG = [
  { externalId: "2",  id: "svc_fb_like_01",          code: "FB-LIKE-01",          platform: SocialPlatform.FACEBOOK, categoryId: "likes",     name: "Like bài viết Facebook - Chất lượng cao", description: "TTC ID 2 - LIKE bài viết Facebook Việt chất lượng cao.", expectedXu: "1800", active: true,  popular: true,  averageTime: "0–6 giờ" },
  { externalId: "49", id: "svc_fb_comment_like_01",  code: "FB-CMT-LIKE-01",      platform: SocialPlatform.FACEBOOK, categoryId: "likes",     name: "Like bình luận Facebook",                 description: "TTC ID 49 - LIKE bình luận Facebook Việt chất lượng cao.", expectedXu: "1100", active: true, popular: false, averageTime: "0–6 giờ" },
  { externalId: "18", id: "svc_fb_comment_01",       code: "FB-CMT-01",           platform: SocialPlatform.FACEBOOK, categoryId: "comments",  name: "Bình luận Facebook tùy chỉnh",            description: "TTC ID 18 - Custom Comments. Chờ trường nội dung bình luận trong Order.", expectedXu: "3000", active: false, popular: false, averageTime: "0–24 giờ" },
  { externalId: "23", id: "svc_fb_page_like_01",     code: "FB-PAGE-LIKE-01",     platform: SocialPlatform.FACEBOOK, categoryId: "likes",     name: "Like Fanpage Facebook",                    description: "TTC ID 23 - Tăng like fanpage Facebook.", expectedXu: "1800", active: true, popular: true, averageTime: "0–24 giờ" },
  { externalId: "24", id: "svc_fb_follow_01",        code: "FB-FOLLOW-01",        platform: SocialPlatform.FACEBOOK, categoryId: "followers", name: "Theo dõi Facebook",                        description: "TTC ID 24 - Tăng theo dõi Facebook.", expectedXu: "1300", active: true, popular: true, averageTime: "0–24 giờ" },
  { externalId: "57", id: "svc_fb_follow_vip_01",    code: "FB-FOLLOW-VIP-01",    platform: SocialPlatform.FACEBOOK, categoryId: "followers", name: "Theo dõi Facebook VIP",                    description: "TTC ID 57 - Tăng theo dõi Facebook VIP.", expectedXu: "1900", active: true, popular: true, averageTime: "0–24 giờ" },
  { externalId: "31", id: "svc_fb_group_member_01",  code: "FB-GROUP-MEMBER-01",  platform: SocialPlatform.FACEBOOK, categoryId: "followers", name: "Thành viên nhóm Facebook",                 description: "TTC ID 31 - Tăng thành viên nhóm Facebook.", expectedXu: "2000", active: true, popular: false, averageTime: "0–24 giờ" },
  { externalId: "30", id: "svc_fb_page_review_01",   code: "FB-PAGE-REVIEW-01",   platform: SocialPlatform.FACEBOOK, categoryId: "comments",  name: "Đánh giá Page Facebook",                  description: "TTC ID 30 - Custom Comments. Chờ trường nội dung đánh giá trong Order.", expectedXu: "2500", active: false, popular: false, averageTime: "0–24 giờ" },

  { externalId: "15", id: "svc_tt_like_01",          code: "TT-LIKE-01",          platform: SocialPlatform.TIKTOK,   categoryId: "likes",     name: "Like video TikTok",                       description: "TTC ID 15 - Tăng TYM TikTok chất lượng cao.", expectedXu: "1000", active: true, popular: true, averageTime: "0–4 giờ" },
  { externalId: "25", id: "svc_tt_save_01",          code: "TT-SAVE-01",          platform: SocialPlatform.TIKTOK,   categoryId: "likes",     name: "Lưu / Yêu thích video TikTok",            description: "TTC ID 25 - Tăng SAVE TikTok.", expectedXu: "850", active: true, popular: false, averageTime: "0–4 giờ" },
  { externalId: "26", id: "svc_tt_share_01",         code: "TT-SHARE-01",         platform: SocialPlatform.TIKTOK,   categoryId: "shares",    name: "Chia sẻ video TikTok",                    description: "TTC ID 26 - Tăng SHARE TikTok.", expectedXu: "1050", active: true, popular: false, averageTime: "0–4 giờ" },
  { externalId: "27", id: "svc_tt_view_01",          code: "TT-VIEW-01",          platform: SocialPlatform.TIKTOK,   categoryId: "views",     name: "Lượt xem video TikTok",                   description: "TTC ID 27 - Tăng VIEW TikTok.", expectedXu: "250", active: true, popular: true, averageTime: "0–3 giờ" },
  { externalId: "29", id: "svc_tt_comment_01",       code: "TT-CMT-01",           platform: SocialPlatform.TIKTOK,   categoryId: "comments",  name: "Bình luận TikTok tùy chỉnh",              description: "TTC ID 29 - Custom Comments. Chờ trường nội dung bình luận trong Order.", expectedXu: "3500", active: false, popular: false, averageTime: "0–24 giờ" },
  { externalId: "56", id: "svc_tt_follow_01",        code: "TT-FOLLOW-01",        platform: SocialPlatform.TIKTOK,   categoryId: "followers", name: "Theo dõi TikTok - Chất lượng cao nhất",    description: "TTC ID 56 - Follow TikTok chất lượng cao nhất, ít tụt.", expectedXu: "3500", active: true, popular: true, averageTime: "0–12 giờ" },

  { externalId: "28", id: "svc_yt_comment_01",       code: "YT-CMT-01",           platform: SocialPlatform.YOUTUBE,  categoryId: "comments",  name: "Bình luận YouTube tùy chỉnh",             description: "TTC ID 28 - Custom Comments. Chờ trường nội dung bình luận trong Order.", expectedXu: "3500", active: false, popular: false, averageTime: "0–48 giờ" },
  { externalId: "58", id: "svc_google_review_01",    code: "GOOGLE-REVIEW-01",    platform: SocialPlatform.GOOGLE,   categoryId: "comments",  name: "Đánh giá Google Maps",                    description: "TTC ID 58 - Custom Comments. Chờ trường nội dung review trong Order.", expectedXu: "100000", active: false, popular: false, averageTime: "0–48 giờ" }
];

const LEGACY_DISABLE_IDS = [
  "svc_ig_follow_01",
  "svc_ig_like_01",
  "svc_ig_view_01",
  "svc_yt_sub_01",
  "svc_yt_view_01",
  "svc_th_follow_01",
  "svc_th_like_01"
];

const REMOVED_FROM_REQUEST = [
  "Facebook Chia sẻ kèm nội dung",
  "Facebook Chia sẻ",
  "Facebook Like Page Profile",
  "TikTok Chia sẻ LIVE",
  "YouTube Subscriber"
];

const CATEGORY_ROWS = [
  ["followers", "Người theo dõi", 10],
  ["likes", "Lượt thích / Cảm xúc", 20],
  ["views", "Lượt xem", 30],
  ["comments", "Bình luận / Đánh giá", 40],
  ["shares", "Chia sẻ", 50]
];

function rawProviderRate(service) {
  const raw = service.rawMetadata;
  if (!raw || typeof raw !== "object") return "";
  return String(raw.providerRate ?? "");
}

function ceilDiv(a, b) {
  return (a + b - 1n) / b;
}

function roundUp(value, unit) {
  return ceilDiv(value, unit) * unit;
}

function sellingPrice(costPer1000) {
  return roundUp(ceilDiv(costPer1000 * 135n, 100n), 500n);
}

function money(v) {
  return Number(v).toLocaleString("vi-VN");
}

try {
  const adapter = new TTCProviderAdapter();
  const liveServices = await adapter.getServices();

  const selected = CATALOG.map((item) => {
    const provider = liveServices.find((service) => service.externalServiceId === item.externalId);
    if (!provider) throw new Error(`Missing TTC service ID ${item.externalId} for ${item.code}`);
    const raw = rawProviderRate(provider);
    if (raw !== item.expectedXu) {
      throw new Error(`TTC rate changed for ID ${item.externalId}: expected ${item.expectedXu} XU, got ${raw} XU. Review pricing before apply.`);
    }
    if (provider.rateUnit !== 1000) {
      throw new Error(`TTC ID ${item.externalId} normalized rateUnit must be 1000, got ${provider.rateUnit}`);
    }
    const price = sellingPrice(provider.providerRateMinor);
    return { ...item, provider, price };
  });

  console.log("");
  console.log(`TTC selected catalog: ${selected.length}/16 matched`);
  console.log("RATE_INPUT_UNIT =", process.env.TTC_RATE_INPUT_UNIT);
  console.log("RATE_UNIT       =", process.env.TTC_RATE_UNIT);
  console.log("XU_TO_VND       =", process.env.TTC_XU_TO_VND_RATE);
  console.log("");

  for (const row of selected) {
    console.log(
      [
        row.externalId.padStart(2, " "),
        row.code.padEnd(20, " "),
        row.active ? "ACTIVE  " : "DISABLED",
        `cost/1k=${money(row.provider.providerRateMinor)}`,
        `sell/1k=${money(row.price)}`,
        row.provider.name
      ].join(" | ")
    );
  }

  console.log("");
  console.log("Removed from customer catalog because TTC API has no matching service:");
  for (const name of REMOVED_FROM_REQUEST) console.log(" -", name);

  if (!APPLY) {
    console.log("");
    console.log("DRY RUN ONLY - database was not modified.");
    console.log("If all 16 rows are correct, run:");
    console.log("node --import tsx qa/ttc-map-live-catalog.mjs --apply");
    process.exitCode = 0;
  } else {
    const providerRecord = await db.provider.findUnique({ where: { code: "TTC" } });
    if (!providerRecord) throw new Error("Provider TTC does not exist. Run db:seed first.");

    const admin = await db.user.findFirst({
      where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
      orderBy: { createdAt: "asc" }
    });
    if (!admin) throw new Error("No ACTIVE ADMIN user found. Run db:seed or create an admin first.");
    const actor = { userId: admin.id };

    // Sync all 58 provider services with corrected normalized provider costs.
    await applyProviderServiceSync(providerRecord.id, liveServices);

    // Connection is verified separately by qa:ttc:readonly. Activate provider for mapped Default services.
    await setProviderEnabled(actor, providerRecord.id, true);

    for (const [id, name, sortOrder] of CATEGORY_ROWS) {
      await db.serviceCategory.upsert({
        where: { id },
        update: { name, sortOrder, enabled: true },
        create: { id, name, sortOrder, enabled: true }
      });
    }

    for (const row of selected) {
      const ps = await db.providerService.findUniqueOrThrow({
        where: {
          providerId_externalServiceId: {
            providerId: providerRecord.id,
            externalServiceId: row.externalId
          }
        }
      });

      const desiredStatus = row.active ? ServiceStatus.ACTIVE : ServiceStatus.DISABLED;
      const existing = await db.service.findUnique({ where: { id: row.id } });
      const data = {
        code: row.code,
        platform: row.platform,
        categoryId: row.categoryId,
        name: row.name,
        description: row.description,
        ratePerThousandMinor: row.price,
        min: ps.min,
        max: ps.max,
        averageTime: row.averageTime,
        status: desiredStatus,
        popular: row.popular
      };

      if (existing) {
        await db.service.update({ where: { id: row.id }, data });
        if (existing.ratePerThousandMinor !== row.price) {
          await db.servicePriceHistory.create({
            data: {
              serviceId: row.id,
              previousRateMinor: existing.ratePerThousandMinor,
              newRateMinor: row.price,
              adminUserId: admin.id,
              reason: "WORK6_TTC_LIVE_CATALOG"
            }
          });
        }
      } else {
        await db.service.create({ data: { id: row.id, ...data } });
      }

      // Any prior route for this internal service is disabled before the deterministic TTC route is written.
      // service_provider_mappings has UNIQUE(service_id, priority). A disabled legacy route
      // can still occupy priority 100, so move that one to a free high priority first.
      const conflictingPriority = await db.serviceProviderMapping.findFirst({
        where: {
          serviceId: row.id,
          priority: 100,
          providerServiceId: { not: ps.id }
        },
        select: { id: true }
      });

      if (conflictingPriority) {
        const occupied = new Set(
          (
            await db.serviceProviderMapping.findMany({
              where: {
                serviceId: row.id,
                id: { not: conflictingPriority.id }
              },
              select: { priority: true }
            })
          ).map((item) => item.priority)
        );

        let sparePriority = 10000;
        while (sparePriority > 100 && occupied.has(sparePriority)) sparePriority -= 1;
        if (sparePriority === 100) {
          throw new Error(`No free mapping priority available for ${row.code}`);
        }

        await db.serviceProviderMapping.update({
          where: { id: conflictingPriority.id },
          data: {
            priority: sparePriority,
            enabled: false,
            status: ProviderMappingStatus.DISABLED
          }
        });

        console.log(`MOVED legacy mapping priority for ${row.code}: 100 -> ${sparePriority}`);
      }

      await db.serviceProviderMapping.updateMany({
        where: {
          serviceId: row.id,
          providerServiceId: { not: ps.id }
        },
        data: {
          enabled: false,
          status: ProviderMappingStatus.DISABLED
        }
      });

      const mapped = await upsertServiceProviderMapping(actor, {
        serviceId: row.id,
        providerServiceId: ps.id,
        enabled: row.active,
        priority: 100,
        markupType: "PERCENTAGE",
        markupBps: 3500,
        fixedMarkupMinor: 0n,
        minimumMarginMinor: 0n,
        pricingMode: "MANUAL"
      });

      // Keep custom-input routes explicitly disabled in both flags, not only enabled=false.
      if (!row.active && mapped.status !== ProviderMappingStatus.DISABLED) {
        await db.serviceProviderMapping.update({
          where: { id: mapped.id },
          data: {
            enabled: false,
            status: ProviderMappingStatus.DISABLED
          }
        });
      }
    }

    // Remove obsolete/mock services from storefront without deleting historical FK targets.
    await db.service.updateMany({
      where: { id: { in: LEGACY_DISABLE_IDS } },
      data: { status: ServiceStatus.DISABLED, popular: false }
    });

    await db.serviceProviderMapping.updateMany({
      where: { serviceId: { in: LEGACY_DISABLE_IDS } },
      data: { enabled: false, status: ProviderMappingStatus.DISABLED }
    });

    console.log("");
    console.log("APPLY COMPLETE");
    console.log("16 TTC-backed customer services mapped.");
    console.log("11 Default services enabled for ordering.");
    console.log("5 Custom Comments services mapped but disabled until custom order text input is implemented.");
    console.log("5 requested services with no TTC API match were excluded.");
    console.log("Legacy Instagram/Threads/YouTube mock services were disabled, not hard-deleted.");
  }
} finally {
  await disconnectDb().catch(() => {});
}
