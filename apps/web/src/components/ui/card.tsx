import type { HTMLAttributes, ReactNode } from "react";
import { PlatformIcon, type Platform } from "@/components/brand/platform-icons";
import { ArrowDownIcon, ArrowUpIcon } from "./icons";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-header", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-content", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-footer", className)} {...props} />;
}

export type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  trend?: { direction: "up" | "down" | "neutral"; value: string };
  icon?: ReactNode;
};

export function StatCard({ label, value, hint, trend, icon }: StatCardProps) {
  return (
    <Card className="stat-card">
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {icon ? <span className="stat-card__icon">{icon}</span> : null}
      </div>
      <strong className="stat-card__value">{value}</strong>
      {(trend || hint) && (
        <div className="stat-card__meta">
          {trend && trend.direction !== "neutral" ? (
            <span className={cn("stat-card__trend", `stat-card__trend--${trend.direction}`)}>
              {trend.direction === "up" ? <ArrowUpIcon size={14} /> : <ArrowDownIcon size={14} />}
              {trend.value}
            </span>
          ) : trend ? <span className="stat-card__trend">{trend.value}</span> : null}
          {hint ? <span>{hint}</span> : null}
        </div>
      )}
    </Card>
  );
}

export type ServiceCardProps = {
  platform: Platform;
  title: string;
  description: string;
  price: string;
  unit?: string;
  status?: string;
  action?: ReactNode;
};

export function ServiceCard({ platform, title, description, price, unit = "/ 1.000", status, action }: ServiceCardProps) {
  return (
    <Card className="service-card">
      <div className="service-card__head">
        <PlatformIcon platform={platform} size="lg" />
        {status ? <span className="service-card__status">{status}</span> : null}
      </div>
      <div>
        <h3 className="service-card__title">{title}</h3>
        <p className="service-card__description">{description}</p>
      </div>
      <div className="service-card__footer">
        <div><strong className="service-card__price">{price}</strong><span className="service-card__unit"> {unit}</span></div>
        {action}
      </div>
    </Card>
  );
}
