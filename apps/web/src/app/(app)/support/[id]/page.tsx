import { SupportThreadView } from "@/components/customer/support-thread-view";

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupportThreadView ticketId={id} />;
}
