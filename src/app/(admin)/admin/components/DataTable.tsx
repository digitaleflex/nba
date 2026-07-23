"use client"

import { cn } from "@nba/design-system"
import type { ReactNode } from "react"

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  emptyState?: ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyState,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="border-b text-muted-foreground uppercase tracking-wider text-[10px]">
            {columns.map((col) => (
              <th key={col.key} className={cn("px-3 py-2", col.headerClassName)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={cn("hover:bg-accent/30", onRowClick && "cursor-pointer")}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-3 py-2", col.className)}>
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && emptyState}
    </div>
  )
}
