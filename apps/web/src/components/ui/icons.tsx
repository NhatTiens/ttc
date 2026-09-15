import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function BaseIcon({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (props: IconProps) => <BaseIcon {...props}><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></BaseIcon>;
export const GridIcon = (props: IconProps) => <BaseIcon {...props}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></BaseIcon>;
export const PlusIcon = (props: IconProps) => <BaseIcon {...props}><path d="M12 5v14M5 12h14"/></BaseIcon>;
export const OrdersIcon = (props: IconProps) => <BaseIcon {...props}><path d="M7 3h10l2 4v14H5V7l2-4Z"/><path d="M5 8h14M9 12h6M9 16h4"/></BaseIcon>;
export const WalletIcon = (props: IconProps) => <BaseIcon {...props}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5Z"/><path d="M15 10h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></BaseIcon>;
export const SupportIcon = (props: IconProps) => <BaseIcon {...props}><path d="M4 12a8 8 0 0 1 16 0v5a3 3 0 0 1-3 3h-2"/><path d="M4 12v4H2v-4h2ZM20 12v4h2v-4h-2Z"/><path d="M9 20h6"/></BaseIcon>;
export const UserIcon = (props: IconProps) => <BaseIcon {...props}><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></BaseIcon>;
export const SearchIcon = (props: IconProps) => <BaseIcon {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></BaseIcon>;
export const BellIcon = (props: IconProps) => <BaseIcon {...props}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></BaseIcon>;
export const MenuIcon = (props: IconProps) => <BaseIcon {...props}><path d="M4 7h16M4 12h16M4 17h16"/></BaseIcon>;
export const ChevronDownIcon = (props: IconProps) => <BaseIcon {...props}><path d="m7 10 5 5 5-5"/></BaseIcon>;
export const ChevronLeftIcon = (props: IconProps) => <BaseIcon {...props}><path d="m15 18-6-6 6-6"/></BaseIcon>;
export const ChevronRightIcon = (props: IconProps) => <BaseIcon {...props}><path d="m9 18 6-6-6-6"/></BaseIcon>;
export const XIcon = (props: IconProps) => <BaseIcon {...props}><path d="m6 6 12 12M18 6 6 18"/></BaseIcon>;
export const CheckIcon = (props: IconProps) => <BaseIcon {...props}><path d="m5 12 4 4L19 6"/></BaseIcon>;
export const AlertIcon = (props: IconProps) => <BaseIcon {...props}><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17.5h.01"/></BaseIcon>;
export const InfoIcon = (props: IconProps) => <BaseIcon {...props}><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></BaseIcon>;
export const RefreshIcon = (props: IconProps) => <BaseIcon {...props}><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8.2A7 7 0 0 1 18.8 7M5.2 17A7 7 0 0 0 17.9 15.8"/></BaseIcon>;
export const MoreIcon = (props: IconProps) => <BaseIcon {...props}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></BaseIcon>;
export const ArrowUpIcon = (props: IconProps) => <BaseIcon {...props}><path d="m7 12 5-5 5 5M12 7v10"/></BaseIcon>;
export const ArrowDownIcon = (props: IconProps) => <BaseIcon {...props}><path d="m7 12 5 5 5-5M12 17V7"/></BaseIcon>;
export const InboxIcon = (props: IconProps) => <BaseIcon {...props}><path d="M4 4h16l2 11v5H2v-5L4 4Z"/><path d="M2 15h6l2 2h4l2-2h6"/></BaseIcon>;
export const TagIcon = (props: IconProps) => <BaseIcon {...props}><path d="M4 4h7l9 9-7 7-9-9V4Z"/><circle cx="8.5" cy="8.5" r="1.2"/></BaseIcon>;
export const ClockIcon = (props: IconProps) => <BaseIcon {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></BaseIcon>;
export const CheckCircleIcon = (props: IconProps) => <BaseIcon {...props}><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></BaseIcon>;
export const TrendIcon = (props: IconProps) => <BaseIcon {...props}><path d="m4 17 6-6 4 4 6-8"/><path d="M15 7h5v5"/></BaseIcon>;
export const CalendarIcon = (props: IconProps) => <BaseIcon {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></BaseIcon>;
export const LockIcon = (props: IconProps) => <BaseIcon {...props}><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></BaseIcon>;
export const MailIcon = (props: IconProps) => <BaseIcon {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></BaseIcon>;
export const ExternalLinkIcon = (props: IconProps) => <BaseIcon {...props}><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H5V6h6"/></BaseIcon>;

