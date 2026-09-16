"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminStatusBadge } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/form-controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Pagination, ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { adminService } from "@/services/admin-service";
import type { AdminDeposit } from "@/domain/admin";
const columns: TableColumn<AdminDeposit>[] = [
{ key:"id",header:"Yêu cầu",render:r=><Link className="text-link" href={`/admin/deposits/${r.id}`}>{r.id}</Link> },
{ key:"customer",header:"Khách hàng",render:r=><div className="table-primary"><strong>{r.customerName}</strong><small>{r.customerEmail}</small></div> },
{ key:"method",header:"Phương thức",render:r=>r.methodName },{ key:"amount",header:"Số tiền",render:r=><strong>{formatCurrency(r.amount)}</strong> },
{ key:"status",header:"Trạng thái",render:r=><AdminStatusBadge status={r.status}/> },{ key:"reference",header:"Tham chiếu",render:r=>r.reference||"—" },{ key:"created",header:"Tạo lúc",render:r=>formatDateTime(r.createdAt) }
];
export default function AdminDepositsPage(){const[search,setSearch]=useState("");const[status,setStatus]=useState("PENDING");const[dateRange,setDateRange]=useState("30d");const[page,setPage]=useState(1);const dep=useMemo(()=>JSON.stringify({search,status,dateRange,page}),[search,status,dateRange,page]);const resource=useAsyncResource(()=>adminService.listDeposits({search,status,dateRange,page,pageSize:20}),dep);return <div className="admin-page"><PageHeader eyebrow="ADMIN / DEPOSITS" title="Nạp tiền" description="Xác nhận thủ công an toàn: credit ví, ledger và audit nằm trong cùng database transaction."/><Card className="admin-filter-card"><div className="admin-filter-grid"><SearchInput value={search} onChange={e=>{setSearch(e.currentTarget.value);setPage(1)}} placeholder="ID, khách hàng, phương thức, tham chiếu..."/><Select value={status} onChange={e=>{setStatus(e.currentTarget.value);setPage(1)}} options={[{value:"all",label:"Tất cả trạng thái"},...['PENDING','CONFIRMED','FAILED','CANCELLED','REFUNDED'].map(value=>({value,label:value}))]}/><Select value={dateRange} onChange={e=>{setDateRange(e.currentTarget.value);setPage(1)}} options={[{value:"all",label:"Mọi thời gian"},{value:"today",label:"Hôm nay"},{value:"7d",label:"7 ngày"},{value:"30d",label:"30 ngày"},{value:"90d",label:"90 ngày"}]}/></div></Card>{resource.loading?<LoadingState label="Đang tải yêu cầu nạp tiền..."/>:resource.error?<ErrorState title="Không thể tải yêu cầu nạp tiền" description={resource.error} onRetry={resource.reload}/>:!resource.data||!resource.data.items.length?<EmptyState title="Không có yêu cầu phù hợp" description="Thử thay đổi bộ lọc."/>:<><ResponsiveTable columns={columns} rows={resource.data.items} getRowKey={r=>r.id} caption="Yêu cầu nạp tiền" renderMobileItem={r=><Card className="admin-mobile-card"><div className="admin-mobile-card__head"><Link className="text-link" href={`/admin/deposits/${r.id}`}>{r.id}</Link><AdminStatusBadge status={r.status}/></div><strong>{formatCurrency(r.amount)}</strong><span>{r.customerName}</span><small>{r.methodName}</small></Card>}/><Pagination page={resource.data.page} pageCount={resource.data.pageCount} onPageChange={setPage} className="admin-pagination"/></>}</div>}
