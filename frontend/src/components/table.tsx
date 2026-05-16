import { Skeleton } from '@/components/ui/skeleton';
import type { ReactNode } from 'react';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from '@tanstack/react-table';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  Table as TablePrimitive,
  TableRow,
} from '@/components/ui/table';

interface TableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  quickActions?: ColumnDef<TData, unknown>[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  rowClassName?: (row: Row<TData>) => string;
  pageSizeOptions?: number[];
  paginationLabels?: {
    previous: string;
    next: string;
  };
}

export function Table<TData>({
  data,
  columns,
  quickActions,
  totalItems,
  currentPage,
  pageSize,
  loading = false,
  itemLabel = 'ITENS',
  onPageChange,
  onPageSizeChange,
  emptyState,
  rowClassName,
  pageSizeOptions = [10, 20, 50],
  paginationLabels = {
    previous: 'Anterior',
    next: 'Próximo',
  },
}: TableProps<TData>) {
  const allColumns = quickActions ? [...columns, ...quickActions] : columns;

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage * pageSize < totalItems;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">
        <TablePrimitive className="border-separate border-spacing-0">
          <TableHeader className="bg-slate-50/50">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className={`z-10 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-500 uppercase ${header.column.id === 'acoes' ? 'pr-6 text-right' : ''} ${header.column.id === 'nome' ? 'w-100' : ''}`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 10) }).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`}>
                  {table.getAllColumns().map((column, colIndex) => {
                    const isAction = column.id === 'acoes' || column.id === 'actions';
                    // Vary the width slightly to make it look like real text
                    const widthClass = isAction
                      ? 'w-8 ml-auto'
                      : (rowIndex + colIndex) % 3 === 0
                        ? 'w-[60%]'
                        : (rowIndex + colIndex) % 2 === 0
                          ? 'w-[85%]'
                          : 'w-[70%]';

                    return (
                      <TableCell
                        key={column.id}
                        className={column.id === 'nome' ? 'font-medium' : ''}
                      >
                        <Skeleton className={`h-4 ${widthClass}`} />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className={rowClassName?.(row)}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.id === 'nome' ? 'font-medium' : ''}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="py-12 text-center text-sm text-slate-500"
                  colSpan={allColumns.length}
                >
                  {emptyState ?? 'Nenhum registro encontrado.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TablePrimitive>
      </div>

      <div className="flex items-center justify-between border-t border-slate-300 bg-white px-4 py-3 text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              ITEMS POR PÁGINA:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={value => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-20 text-xs font-medium">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(option => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="text-[11px] font-bold tracking-wider uppercase">
            EXIBINDO {startItem}-{endItem} DE {totalItems} {itemLabel}
          </span>
        </div>

        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={!hasPreviousPage}
                tabIndex={!hasPreviousPage ? -1 : 0}
                onClick={event => {
                  event.preventDefault();
                  if (hasPreviousPage) onPageChange(currentPage - 1);
                }}
                className="text-[11px] font-bold tracking-wider text-slate-400 uppercase"
                label={paginationLabels.previous}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={!hasNextPage}
                tabIndex={!hasNextPage ? -1 : 0}
                onClick={event => {
                  event.preventDefault();
                  if (hasNextPage) onPageChange(currentPage + 1);
                }}
                className="text-[11px] font-bold tracking-wider text-blue-600 uppercase hover:text-blue-700 disabled:text-slate-300"
                label={paginationLabels.next}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
