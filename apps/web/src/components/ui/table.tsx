import type { ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { IconButton } from "./button";
import { cn } from "@/lib/cn";

export type TableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export function Table<T>({ columns, rows, getRowKey, caption }: { columns: TableColumn<T>[]; rows: T[]; getRowKey: (row: T) => string; caption?: string }) {
  return (
    <div className="table-wrap">
      <table className="table">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead><tr>{columns.map((column) => <th key={column.key} className={column.className} scope="col">{column.header}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={getRowKey(row)}>{columns.map((column) => <td key={column.key} className={column.className}>{column.render(row)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function ResponsiveTable<T>({ columns, rows, getRowKey, renderMobileItem, caption }: { columns: TableColumn<T>[]; rows: T[]; getRowKey: (row: T) => string; renderMobileItem: (row: T) => ReactNode; caption?: string }) {
  return (
    <div className="responsive-table">
      <div className="responsive-table__desktop"><Table columns={columns} rows={rows} getRowKey={getRowKey} caption={caption} /></div>
      <div className="responsive-table__mobile" role="list" aria-label={caption}>{rows.map((row) => <div key={getRowKey(row)} role="listitem">{renderMobileItem(row)}</div>)}</div>
    </div>
  );
}

export function Pagination({ page, pageCount, onPageChange, className }: { page: number; pageCount: number; onPageChange?: (page: number) => void; className?: string }) {
  const pages = Array.from({ length: Math.min(pageCount, 5) }, (_, index) => index + 1);
  return (
    <nav className={cn("pagination", className)} aria-label="Phân trang">
      <IconButton label="Trang trước" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}><ChevronLeftIcon size={16} /></IconButton>
      <div className="pagination__pages">{pages.map((item) => <button key={item} type="button" className={cn("pagination__page", item === page && "pagination__page--active")} aria-current={item === page ? "page" : undefined} onClick={() => onPageChange?.(item)}>{item}</button>)}</div>
      <IconButton label="Trang sau" variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange?.(page + 1)}><ChevronRightIcon size={16} /></IconButton>
    </nav>
  );
}
