import { cn } from "@/lib/cn";

export type Platform = "facebook" | "tiktok" | "instagram" | "youtube" | "threads" | "google";

const labels: Record<Platform, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  threads: "Threads",
  google: "Google Maps"
};

export function PlatformIcon({ platform, size = "md", className }: { platform: Platform; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span className={cn("platform-icon", `platform-icon--${platform}`, `platform-icon--${size}`, className)} role="img" aria-label={labels[platform]}>
      {platform === "facebook" && <span className="platform-glyph platform-glyph--facebook">f</span>}
      {platform === "tiktok" && <span className="platform-glyph platform-glyph--tiktok">♪</span>}
      {platform === "instagram" && <span className="platform-glyph platform-glyph--instagram">◎</span>}
      {platform === "youtube" && <span className="platform-glyph platform-glyph--youtube">▶</span>}
      {platform === "threads" && <span className="platform-glyph platform-glyph--threads">@</span>}
      {platform === "google" && <span className="platform-glyph platform-glyph--google">G</span>}
    </span>
  );
}
