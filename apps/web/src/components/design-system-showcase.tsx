"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { PlatformIcon, type Platform } from "@/components/brand/platform-icons";
import { PageHeader } from "@/components/layout/page-header";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  ConfirmDialog,
  Drawer,
  EmptyState,
  ErrorState,
  GridIcon,
  IconButton,
  InfoIcon,
  Input,
  LoadingState,
  Modal,
  MoreIcon,
  NumberInput,
  OrderStatus,
  Pagination,
  ResponsiveTable,
  SearchInput,
  Select,
  ServiceCard,
  Skeleton,
  StatCard,
  StatusBadge,
  Tabs,
  Textarea,
  UserAvatar,
  WalletBalance,
  type OrderStatusValue,
  type TableColumn,
  useToast
} from "@/components/ui";

const platforms: Platform[] = ["facebook", "tiktok", "instagram", "youtube", "threads"];
const statuses: OrderStatusValue[] = ["Processing", "Completed", "Pending", "Failed", "Cancelled", "Partial", "Refunded"];

type OrderRow = {
  id: string;
  service: string;
  platform: Platform;
  quantity: string;
  amount: string;
  status: OrderStatusValue;
};

const orders: OrderRow[] = [
  { id: "#TT-240812", service: "Facebook Post Likes", platform: "facebook", quantity: "5,000", amount: "125.000\u0111", status: "Processing" },
  { id: "#TT-240811", service: "TikTok Followers", platform: "tiktok", quantity: "2,500", amount: "242.500\u0111", status: "Completed" },
  { id: "#TT-240810", service: "Instagram Reel Views", platform: "instagram", quantity: "10,000", amount: "78.000\u0111", status: "Partial" }
];

const orderColumns: TableColumn<OrderRow>[] = [
  { key: "id", header: "Order", render: (row) => <strong>{row.id}</strong> },
  { key: "service", header: "Service", render: (row) => <div className="ds-stack"><PlatformIcon platform={row.platform} size="sm" /><span>{row.service}</span></div> },
  { key: "quantity", header: "Quantity", render: (row) => row.quantity },
  { key: "amount", header: "Amount", render: (row) => <strong>{row.amount}</strong> },
  { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
  { key: "actions", header: "", render: () => <IconButton label="More actions" size="sm"><MoreIcon size={16} /></IconButton> }
];

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="ds-section"><div className="ds-section__head"><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{children}</section>;
}

export function DesignSystemShowcase() {
  const [quantity, setQuantity] = useState(1000);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();

  return (
    <div className="ds-page">
      <PageHeader
        eyebrow="Foundation"
        title="Design System"
        description="Reusable visual language and interaction primitives for the customer and admin applications."
        actions={<><Button variant="outline">Documentation</Button><Button onClick={() => toast({ tone: "success", title: "Design tokens loaded", description: "The component set is ready for review." })}>Test toast</Button></>}
      />

      <Section title="Typography" description="System font stack, compact dashboard rhythm, and clear hierarchy.">
        <Card><CardContent><div className="ds-typography">
          <div className="ds-type-row"><span>Display / 32</span><div className="ds-type-display">Reliable tools for daily growth</div></div>
          <div className="ds-type-row"><span>Heading 1 / 26</span><div className="ds-type-h1">Order management</div></div>
          <div className="ds-type-row"><span>Heading 2 / 20</span><div className="ds-type-h2">Recent activity</div></div>
          <div className="ds-type-row"><span>Body / 14</span><div className="ds-type-body">A calm interface keeps pricing, order status, and account balance easy to scan.</div></div>
          <div className="ds-type-row"><span>Small / 12</span><div className="ds-type-small">Secondary metadata and supporting text.</div></div>
        </div></CardContent></Card>
      </Section>

      <Section title="Colors" description="Blue is reserved for action and focus. Navy anchors navigation; neutral surfaces carry most content.">
        <div className="ds-swatch-grid">
          {["navy", "primary", "surface", "background", "success", "warning", "danger", "purple"].map((token) => <div className="ds-swatch" key={token}><div className={`ds-swatch__color token-bg-${token}`} /><div className="ds-swatch__copy"><strong>{token}</strong><code>--color-{token}</code></div></div>)}
        </div>
      </Section>

      <Section title="Buttons & icon buttons">
        <Card><CardContent><div className="ds-stack">
          <Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button><Button loading>Loading</Button><Button disabled>Disabled</Button><IconButton label="Grid"><GridIcon size={18} /></IconButton><IconButton label="Information" variant="outline"><InfoIcon size={18} /></IconButton>
        </div></CardContent></Card>
      </Section>

      <Section title="Form controls" description="Native controls first, explicit labels and errors, visible keyboard focus.">
        <Card><CardContent><div className="ds-form-grid">
          <Input label="Target link" placeholder="https://..." hint="Paste the public post or profile URL." />
          <Select label="Platform" defaultValue="facebook" options={platforms.map((platform) => ({ value: platform, label: platform[0].toUpperCase() + platform.slice(1) }))} />
          <NumberInput label="Quantity" value={quantity} min={100} max={100000} step={100} onValueChange={setQuantity} hint="Minimum 100, maximum 100,000." />
          <Input label="Validation example" value="invalid-link" readOnly error="This link is not supported for the selected service." />
          <div className="ds-form-grid__wide"><Textarea label="Notes" placeholder="Optional order note" /></div>
          <div className="ds-form-grid__wide"><SearchInput placeholder="Search services or order IDs..." /></div>
        </div></CardContent></Card>
      </Section>

      <Section title="Platform icons">
        <div className="ds-platform-row">{platforms.map((platform) => <div className="ds-platform-item" key={platform}><PlatformIcon platform={platform} /><span>{platform[0].toUpperCase() + platform.slice(1)}</span></div>)}</div>
      </Section>

      <Section title="Cards" description="White surfaces, subtle borders, restrained shadows.">
        <div className="ds-grid ds-grid--4">
          <StatCard label="Available balance" value="1.250.000\u0111" hint="Ready to spend" icon={<GridIcon size={18} />} />
          <StatCard label="Orders this month" value="128" trend={{ direction: "up", value: "12.4%" }} hint="vs. last month" />
          <StatCard label="Processing" value="16" trend={{ direction: "down", value: "3.2%" }} hint="vs. last week" />
          <StatCard label="Completed" value="2,948" trend={{ direction: "up", value: "8.7%" }} hint="all time" />
        </div>
        <div className="ds-grid ds-grid--3">
          <ServiceCard platform="facebook" title="Facebook Post Likes" description="Stable likes for public Facebook posts." price="25.000\u0111" status="Available" action={<Button size="sm" variant="outline">Choose</Button>} />
          <ServiceCard platform="tiktok" title="TikTok Followers" description="Follower package with gradual delivery." price="97.000\u0111" status="Available" action={<Button size="sm" variant="outline">Choose</Button>} />
          <ServiceCard platform="youtube" title="YouTube Views" description="Views for public YouTube videos." price="42.000\u0111" status="Available" action={<Button size="sm" variant="outline">Choose</Button>} />
        </div>
        <Card><CardHeader><strong>Composed card</strong></CardHeader><CardContent><p className="ds-type-small">Header, content, and footer stay visually consistent across flows.</p></CardContent><CardFooter><Button variant="outline" size="sm">Secondary action</Button></CardFooter></Card>
      </Section>

      <Section title="Tabs">
        <Card><CardContent><Tabs defaultValue="all" items={[{ value: "all", label: "All services", content: <p className="ds-type-small">All service categories are visible.</p> }, { value: "popular", label: "Popular", content: <p className="ds-type-small">Frequently ordered services appear here.</p> }, { value: "paused", label: "Paused", content: <p className="ds-type-small">Temporarily unavailable services.</p> }]} /></CardContent></Card>
      </Section>

      <Section title="Table & responsive table" description="Desktop table becomes scan-friendly cards below 768px.">
        <ResponsiveTable
          columns={orderColumns}
          rows={orders}
          getRowKey={(row) => row.id}
          caption="Recent order examples"
          renderMobileItem={(row) => <div className="ds-table-mobile-card"><div className="ds-table-mobile-card__top"><div className="ds-stack"><PlatformIcon platform={row.platform} size="sm" /><strong>{row.id}</strong></div><OrderStatus status={row.status} /></div><strong>{row.service}</strong><div className="ds-table-mobile-card__meta"><span>Quantity: {row.quantity}</span><span>Amount: {row.amount}</span></div></div>}
        />
        <Pagination page={page} pageCount={5} onPageChange={setPage} />
      </Section>

      <Section title="Badges & order status">
        <Card><CardContent><div className="ds-stack"><Badge>Neutral</Badge><Badge tone="blue">Info</Badge><Badge tone="green">Success</Badge><Badge tone="amber">Warning</Badge><Badge tone="red">Error</Badge><Badge tone="purple">Refund</Badge></div><div className="ds-status-grid">{statuses.map((status) => <OrderStatus key={status} status={status} />)}</div></CardContent></Card>
      </Section>

      <Section title="Identity & account utility">
        <Card><CardContent><div className="ds-stack"><UserAvatar name="Nguyen Minh" size="lg" /><UserAvatar name="Le Anh" /><WalletBalance amount="1.250.000\u0111" /><WalletBalance amount="1.250K" compact /></div></CardContent></Card>
      </Section>

      <Section title="Modal, drawer & confirm dialog" description="Native dialog semantics provide focus trapping and Escape-key handling.">
        <Card><CardContent><div className="ds-stack"><Button onClick={() => setModalOpen(true)}>Open modal</Button><Button variant="outline" onClick={() => setDrawerOpen(true)}>Open drawer</Button><Button variant="danger" onClick={() => setConfirmOpen(true)}>Open confirm</Button></div></CardContent></Card>
        <Modal open={modalOpen} onOpenChange={setModalOpen} title="Create a reusable dialog" description="This is a design-system interaction example." footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={() => setModalOpen(false)}>Continue</Button></>}><Input label="Reference" placeholder="Example value" /></Modal>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Drawer example"><div className="ds-grid"><p className="ds-type-small">Useful for contextual filters, mobile navigation, or secondary forms.</p><Input label="Search" placeholder="Filter options" /></div></Drawer>
        <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Cancel this example?" description="Destructive confirmations should state the impact clearly before continuing." confirmLabel="Cancel item" destructive onConfirm={() => toast({ tone: "info", title: "Example cancelled" })} />
      </Section>

      <Section title="Toast">
        <Card><CardContent><div className="ds-stack"><Button variant="outline" onClick={() => toast({ tone: "info", title: "Order update", description: "Order #TT-240812 is processing." })}>Info toast</Button><Button variant="outline" onClick={() => toast({ tone: "success", title: "Payment confirmed", description: "Your wallet has been credited." })}>Success toast</Button><Button variant="outline" onClick={() => toast({ tone: "error", title: "Request failed", description: "Please retry in a moment." })}>Error toast</Button></div></CardContent></Card>
      </Section>

      <Section title="Loading, empty & error states">
        <div className="ds-grid ds-grid--3"><LoadingState label="Loading orders" /><EmptyState title="No orders yet" description="Orders will appear here after the first purchase." action={<Button size="sm">Create order</Button>} /><ErrorState onRetry={() => toast({ tone: "info", title: "Retry started" })} /></div>
        <Card><div className="ds-skeleton-card"><div className="ds-skeleton-row"><Skeleton className="skeleton-avatar" /><div className="ds-grid skeleton-lines"><Skeleton /><Skeleton className="skeleton-short" /></div></div><Skeleton className="skeleton-wide" /><Skeleton className="skeleton-medium" /></div></Card>
      </Section>
    </div>
  );
}
