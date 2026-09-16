"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/form-controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Pagination, ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { adminService } from "@/services/admin-service";
import type { AdminWallet } from "@/domain/admin";
const columns: TableColumn<AdminWallet>[]=[{key:"customer",header:"Khách hàng",render:r=><div className="table-primary"><Link className="text-link" href={`/admin/users/${r.userId}`}><strong>{r.customerName}</strong></Link><small>{r.email}</small></div>},{key:"balance",header:"Số dư",render:r=><strong>{formatCurrency(r.balance)}</strong>},{key:"reserved",header:"Dự trữ",render:r=>formatCurrency(r.reserved)},{key:"currency",header:"Tiền tệ",render:r=>r.currency},{key:"updated",header:"Cập nhật",render:r=>formatDateTime(r.updatedAt)}];
export default function Wallets(){const[search,setSearch]=useState("");const[page,setPage]=useState(1);const dep=useMemo(()=>`${search}:${page}`,[search,page]);const resource=useAsyncResource(()=>adminService.listWallets({search,page,pageSize:20}),dep);return <div className="admin-page"><PageHeader eyebrow="ADMIN / WALLETS" title="Ví khách hàng" description="Số dư chỉ thay đổi thông qua ledger-backed operations; Admin không sửa balance trực tiếp."/><Card className="admin-filter-card"><SearchInput value={search} onChange={e=>{setSearch(e.currentTarget.value);setPage(1)}} placeholder="Tên hoặc email khách hàng..."/></Card>{resource.loading?<LoadingState label="Đang tải ví..."/>:resource.error?<ErrorState title="Không thể tải ví" description={resource.error} onRetry={resource.reload}/>:!resource.data||!resource.data.items.length?<EmptyState title="Không có ví phù hợp" description="Thử từ khóa khác."/>:<><ResponsiveTable columns={columns} rows={resource.data.items} getRowKey={r=>r.id} caption="Danh sách ví" renderMobileItem={r=><Card className="admin-mobile-card"><div className="admin-mobile-card__head"><Link className="text-link" href={`/admin/users/${r.userId}`}>{r.customerName}</Link><strong>{formatCurrency(r.balance)}</strong></div><span>{r.email}</span><small>Dự trữ {formatCurrency(r.reserved)}</small></Card>}/><Pagination page={resource.data.page} pageCount={resource.data.pageCount} onPageChange={setPage} className="admin-pagination"/></>}</div>}
