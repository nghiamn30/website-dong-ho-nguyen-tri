"use client";

import {
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Filter,
  FilterX,
  GripVertical,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SortDirection = "asc" | "desc";
type TableMode = "client" | "server";
type PaginationMode = "pagination" | "infinite" | "none";

export interface AdvancedDataTableColumn<TData> {
  id: string;
  header: ReactNode;
  accessor?: keyof TData | ((row: TData) => unknown);
  cell?: (row: TData) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  align?: "left" | "center" | "right";
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  enableHiding?: boolean;
  aggregate?: (rows: TData[]) => ReactNode;
  meta?: {
    className?: string;
    headerClassName?: string;
  };
}

export interface AdvancedDataTableState {
  sort?: { columnId: string; direction: SortDirection } | null;
  globalFilter?: string;
  columnFilters?: Record<string, string>;
  pageIndex?: number;
  pageSize?: number;
  columnOrder?: string[];
  hiddenColumnIds?: string[];
  columnWidths?: Record<string, number>;
  showColumnFilters?: boolean;
}

export interface AdvancedDataTableProps<TData> {
  columns: AdvancedDataTableColumn<TData>[];
  data: TData[];
  className?: string;
  emptyMessage?: ReactNode;
  getRowId?: (row: TData, index: number) => string;
  mode?: TableMode;
  state?: AdvancedDataTableState;
  onStateChange?: (state: AdvancedDataTableState) => void;
  stateStorageKey?: string;
  stickyHeader?: boolean;
  enableGlobalFilter?: boolean;
  enableColumnFilters?: boolean;
  enableColumnResizing?: boolean;
  enableColumnReorder?: boolean;
  enableColumnVisibility?: boolean;
  paginationMode?: PaginationMode;
  pageSizeOptions?: number[];
  virtualized?: boolean;
  rowHeight?: number;
  maxHeight?: number | string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

const DEFAULT_STATE: Required<
  Pick<
    AdvancedDataTableState,
    | "sort"
    | "globalFilter"
    | "columnFilters"
    | "pageIndex"
    | "pageSize"
    | "columnOrder"
    | "hiddenColumnIds"
    | "columnWidths"
    | "showColumnFilters"
  >
> = {
  sort: null,
  globalFilter: "",
  columnFilters: {},
  pageIndex: 0,
  pageSize: 25,
  columnOrder: [],
  hiddenColumnIds: [],
  columnWidths: {},
  showColumnFilters: false,
};

const VIRTUAL_OVERSCAN = 6;
const DEFAULT_ROW_HEIGHT = 44;

export function AdvancedDataTable<TData>({
  columns,
  data,
  className,
  emptyMessage = "Không có dữ liệu phù hợp.",
  getRowId,
  mode = "client",
  state,
  onStateChange,
  stateStorageKey,
  stickyHeader = true,
  enableGlobalFilter = true,
  enableColumnFilters = true,
  enableColumnResizing = true,
  enableColumnReorder = true,
  enableColumnVisibility = true,
  paginationMode = "pagination",
  pageSizeOptions = [25, 50, 100],
  virtualized = false,
  rowHeight = DEFAULT_ROW_HEIGHT,
  maxHeight = 560,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: AdvancedDataTableProps<TData>) {
  const [storedState, setStoredState] = useState<AdvancedDataTableState>(() => {
    const initialState = readStoredState(stateStorageKey);

    return {
      ...initialState,
      pageSize: initialState.pageSize ?? pageSizeOptions[0] ?? DEFAULT_STATE.pageSize,
    };
  });
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const tableState = useMemo(
    () => mergeTableState(storedState, state),
    [state, storedState],
  );

  const setTableState = useCallback(
    (patch: Partial<AdvancedDataTableState>) => {
      setStoredState((current) => {
        const next = mergeTableState(current, patch);
        onStateChange?.(next);

        if (stateStorageKey && typeof window !== "undefined") {
          window.localStorage.setItem(
            stateStorageKey,
            JSON.stringify(stripSessionOnlyFields(next)),
          );
        }

        return next;
      });
    },
    [onStateChange, stateStorageKey],
  );

  const orderedColumns = useMemo(() => {
    const order = tableState.columnOrder ?? [];
    const byId = new Map(columns.map((column) => [column.id, column]));
    const ordered = order
      .map((id) => byId.get(id))
      .filter((column): column is AdvancedDataTableColumn<TData> =>
        Boolean(column),
      );
    const missing = columns.filter((column) => !order.includes(column.id));

    return [...ordered, ...missing];
  }, [columns, tableState.columnOrder]);

  const hiddenColumnIds = useMemo(
    () => tableState.hiddenColumnIds ?? [],
    [tableState.hiddenColumnIds],
  );
  const visibleColumns = useMemo(
    () =>
      orderedColumns.filter(
        (column) =>
          column.enableHiding === false || !hiddenColumnIds.includes(column.id),
      ),
    [hiddenColumnIds, orderedColumns],
  );

  const processedRows = useMemo(() => {
    if (mode === "server") {
      return data;
    }

    let nextRows = data;
    const normalizedGlobalFilter = normalizeFilter(tableState.globalFilter);
    if (enableGlobalFilter && normalizedGlobalFilter) {
      nextRows = nextRows.filter((row) =>
        columns.some((column) =>
          normalizeFilter(getColumnValue(row, column)).includes(
            normalizedGlobalFilter,
          ),
        ),
      );
    }

    if (enableColumnFilters) {
      const filters = tableState.columnFilters ?? {};
      for (const [columnId, filterValue] of Object.entries(filters)) {
        const normalizedFilter = normalizeFilter(filterValue);
        if (!normalizedFilter) {
          continue;
        }

        const column = columns.find((item) => item.id === columnId);
        if (!column) {
          continue;
        }

        nextRows = nextRows.filter((row) =>
          normalizeFilter(getColumnValue(row, column)).includes(
            normalizedFilter,
          ),
        );
      }
    }

    const sort = tableState.sort;
    if (sort) {
      const column = columns.find((item) => item.id === sort.columnId);
      if (column) {
        nextRows = [...nextRows].sort((left, right) => {
          const result = compareValues(
            getColumnValue(left, column),
            getColumnValue(right, column),
          );

          return sort.direction === "asc" ? result : -result;
        });
      }
    }

    return nextRows;
  }, [
    columns,
    data,
    enableColumnFilters,
    enableGlobalFilter,
    mode,
    tableState.columnFilters,
    tableState.globalFilter,
    tableState.sort,
  ]);

  const pageSize = tableState.pageSize ?? pageSizeOptions[0] ?? 25;
  const pageCount = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const pageIndex = Math.min(tableState.pageIndex ?? 0, pageCount - 1);

  const pagedRows = useMemo(() => {
    if (paginationMode !== "pagination") {
      return processedRows;
    }

    const start = pageIndex * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [pageIndex, pageSize, paginationMode, processedRows]);

  const renderRows = paginationMode === "none" ? processedRows : pagedRows;

  const virtualRange = useMemo(() => {
    if (!virtualized || renderRows.length === 0) {
      return {
        endIndex: renderRows.length,
        startIndex: 0,
        topHeight: 0,
        bottomHeight: 0,
      };
    }

    const visibleCount = Math.ceil(viewportHeight / rowHeight);
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / rowHeight) - VIRTUAL_OVERSCAN,
    );
    const endIndex = Math.min(
      renderRows.length,
      startIndex + visibleCount + VIRTUAL_OVERSCAN * 2,
    );

    return {
      endIndex,
      startIndex,
      topHeight: startIndex * rowHeight,
      bottomHeight: Math.max(0, (renderRows.length - endIndex) * rowHeight),
    };
  }, [renderRows.length, rowHeight, scrollTop, viewportHeight, virtualized]);

  const visibleRows = virtualized
    ? renderRows.slice(virtualRange.startIndex, virtualRange.endIndex)
    : renderRows;

  const hasAggregates = visibleColumns.some((column) => column.aggregate);

  const updateScrollMetrics = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    setScrollTop(element.scrollTop);
    setViewportHeight(element.clientHeight);

    if (
      paginationMode === "infinite" &&
      hasMore &&
      onLoadMore &&
      !isLoadingMore &&
      element.scrollTop + element.clientHeight >= element.scrollHeight - 96
    ) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore, paginationMode]);

  useEffect(() => {
    updateScrollMetrics();
  }, [renderRows.length, updateScrollMetrics]);

  const toggleSort = useCallback(
    (columnId: string) => {
      const current = tableState.sort;
      const direction =
        current?.columnId === columnId && current.direction === "asc"
          ? "desc"
          : "asc";

      setTableState({
        pageIndex: 0,
        sort: { columnId, direction },
      });
    },
    [setTableState, tableState.sort],
  );

  const setColumnFilter = useCallback(
    (columnId: string, value: string) => {
      setTableState({
        columnFilters: {
          ...(tableState.columnFilters ?? {}),
          [columnId]: value,
        },
        pageIndex: 0,
      });
    },
    [setTableState, tableState.columnFilters],
  );

  const setColumnVisibility = useCallback(
    (columnId: string, isVisible: boolean) => {
      const current = tableState.hiddenColumnIds ?? [];
      setTableState({
        hiddenColumnIds: isVisible
          ? current.filter((id) => id !== columnId)
          : [...current, columnId],
      });
    },
    [setTableState, tableState.hiddenColumnIds],
  );

  const moveColumn = useCallback(
    (columnId: string, offset: -1 | 1) => {
      const current = orderedColumns.map((column) => column.id);
      const index = current.indexOf(columnId);
      const nextIndex = index + offset;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      setTableState({ columnOrder: next });
    },
    [orderedColumns, setTableState],
  );

  const resizeColumn = useCallback(
    (
      event: ReactMouseEvent<HTMLButtonElement>,
      column: AdvancedDataTableColumn<TData>,
    ) => {
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const headerMinWidth = estimateHeaderWidth(
        column.header,
        column.sortable !== false,
      );
      const startWidth =
        tableState.columnWidths?.[column.id] ??
        Math.max(column.width ?? 160, headerMinWidth);

      const onMouseMove = (moveEvent: MouseEvent) => {
        const minWidth = column.minWidth ?? headerMinWidth;
        const maxWidth = column.maxWidth ?? 720;
        const nextWidth = Math.min(
          maxWidth,
          Math.max(minWidth, startWidth + moveEvent.clientX - startX),
        );
        setTableState({
          columnWidths: {
            ...(tableState.columnWidths ?? {}),
            [column.id]: nextWidth,
          },
        });
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [setTableState, tableState.columnWidths],
  );

  const totalRows = processedRows.length;
  const pageStart =
    totalRows === 0 || paginationMode !== "pagination"
      ? 0
      : pageIndex * pageSize + 1;
  const pageEnd =
    paginationMode === "pagination"
      ? Math.min(totalRows, (pageIndex + 1) * pageSize)
      : renderRows.length;

  const showColumnFilters = tableState.showColumnFilters ?? false;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {enableGlobalFilter ? (
            <div className="relative min-w-56 flex-1 md:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Tìm trong bảng"
                value={tableState.globalFilter ?? ""}
                onChange={(event) =>
                  setTableState({
                    globalFilter: event.target.value,
                    pageIndex: 0,
                  })
                }
              />
            </div>
          ) : null}
          {enableColumnFilters ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={showColumnFilters}
                aria-label={
                  showColumnFilters
                    ? "Ẩn dòng lọc theo cột"
                    : "Hiện dòng lọc theo cột"
                }
                onClick={() =>
                  setTableState({
                    showColumnFilters: !showColumnFilters,
                  })
                }
              >
                {showColumnFilters ? (
                  <FilterX data-icon="inline-start" />
                ) : (
                  <Filter data-icon="inline-start" />
                )}
                {showColumnFilters ? "Ẩn lọc cột" : "Hiện lọc cột"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setTableState({
                    columnFilters: {},
                    globalFilter: "",
                    pageIndex: 0,
                  })
                }
              >
                <Filter data-icon="inline-start" />
                Xóa lọc
              </Button>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {paginationMode === "pagination" ? (
            <Select
              value={String(pageSize)}
              onValueChange={(value) =>
                setTableState({ pageIndex: 0, pageSize: Number(value) })
              }
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue>{pageSize}/trang</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}/trang
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {enableColumnVisibility || enableColumnReorder ? (
            <ColumnMenu
              columns={orderedColumns}
              hiddenColumnIds={hiddenColumnIds}
              enableColumnReorder={enableColumnReorder}
              enableColumnVisibility={enableColumnVisibility}
              onMoveColumn={moveColumn}
              onSetColumnVisibility={setColumnVisibility}
            />
          ) : null}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative max-w-full overflow-auto rounded-md border"
        style={{ maxHeight }}
        onScroll={updateScrollMetrics}
      >
        <table className="w-full min-w-max table-fixed caption-bottom border-separate border-spacing-0 text-sm">
          <colgroup>
            {visibleColumns.map((column) => {
              const userWidth = tableState.columnWidths?.[column.id];
              const headerMinWidth = estimateHeaderWidth(
                column.header,
                column.sortable !== false,
              );
              const baseWidth = Math.max(column.width ?? 160, headerMinWidth);
              const width = userWidth ?? baseWidth;

              return <col key={column.id} style={{ width }} />;
            })}
          </colgroup>
          <TableHeader className="bg-muted/70">
            <TableRow className="hover:bg-transparent">
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    stickyHeader ? "sticky top-0 z-20 bg-muted" : "relative",
                    alignClass(column.align),
                    "select-none border-b whitespace-nowrap",
                    column.meta?.headerClassName,
                  )}
                >
                  {column.sortable === false ? (
                    <span>{column.header}</span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="-ml-2 max-w-full justify-start px-2"
                      onClick={() => toggleSort(column.id)}
                    >
                      <span className="truncate">{column.header}</span>
                      <SortIcon
                        active={tableState.sort?.columnId === column.id}
                        direction={tableState.sort?.direction}
                      />
                    </Button>
                  )}
                  {enableColumnResizing ? (
                    <button
                      type="button"
                      aria-label="Đổi độ rộng cột"
                      className="absolute top-0 right-0 h-full w-2 cursor-col-resize touch-none opacity-0 hover:bg-border hover:opacity-100 focus-visible:opacity-100"
                      onMouseDown={(event) => resizeColumn(event, column)}
                    />
                  ) : null}
                </TableHead>
              ))}
            </TableRow>
            {enableColumnFilters && showColumnFilters ? (
              <TableRow className="hover:bg-transparent">
                {visibleColumns.map((column) => (
                  <TableHead
                    key={`${column.id}-filter`}
                    className={cn(
                      stickyHeader && "sticky top-10 z-10 bg-muted",
                      "border-b p-2",
                    )}
                  >
                    {column.filterable === false ? null : (
                      <Input
                        aria-label={`Lọc ${textFromNode(column.header)}`}
                        placeholder={`Lọc ${textFromNode(column.header).toLowerCase()}...`}
                        className="h-7"
                        value={tableState.columnFilters?.[column.id] ?? ""}
                        onChange={(event) =>
                          setColumnFilter(column.id, event.target.value)
                        }
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ) : null}
          </TableHeader>
          <TableBody>
            {renderRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {virtualRange.topHeight > 0 ? (
                  <TableRow aria-hidden>
                    <TableCell
                      colSpan={visibleColumns.length}
                      style={{ height: virtualRange.topHeight }}
                    />
                  </TableRow>
                ) : null}
                {visibleRows.map((row, index) => {
                  const sourceIndex = virtualized
                    ? virtualRange.startIndex + index
                    : index;

                  return (
                    <MemoizedDataTableRow
                      key={resolveRowId(row, sourceIndex, getRowId)}
                      columns={visibleColumns}
                      row={row}
                    />
                  );
                })}
                {virtualRange.bottomHeight > 0 ? (
                  <TableRow aria-hidden>
                    <TableCell
                      colSpan={visibleColumns.length}
                      style={{ height: virtualRange.bottomHeight }}
                    />
                  </TableRow>
                ) : null}
              </>
            )}
          </TableBody>
          {hasAggregates ? (
            <TableFooter className="sticky bottom-0 z-10 bg-muted/80">
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableCell
                    key={`${column.id}-aggregate`}
                    className={cn(
                      "border-t font-medium",
                      alignClass(column.align),
                      column.meta?.className,
                    )}
                  >
                    {column.aggregate?.(processedRows) ?? ""}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          ) : null}
        </table>
      </div>

      <div className="flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>
          {paginationMode === "pagination"
            ? `Hiển thị ${pageStart}-${pageEnd}/${totalRows}`
            : `Hiển thị ${pageEnd}/${totalRows}`}
        </span>
        {paginationMode === "pagination" ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label="Trang đầu"
              disabled={pageIndex === 0}
              onClick={() => setTableState({ pageIndex: 0 })}
            >
              <ChevronsLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label="Trang trước"
              disabled={pageIndex === 0}
              onClick={() => setTableState({ pageIndex: pageIndex - 1 })}
            >
              <ChevronLeft />
            </Button>
            <span className="px-2">
              {pageIndex + 1}/{pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label="Trang sau"
              disabled={pageIndex >= pageCount - 1}
              onClick={() => setTableState({ pageIndex: pageIndex + 1 })}
            >
              <ChevronRight />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label="Trang cuối"
              disabled={pageIndex >= pageCount - 1}
              onClick={() => setTableState({ pageIndex: pageCount - 1 })}
            >
              <ChevronsRight />
            </Button>
          </div>
        ) : null}
        {paginationMode === "infinite" && hasMore && onLoadMore ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoadingMore}
            onClick={onLoadMore}
          >
            {isLoadingMore ? <Loader2 className="animate-spin" /> : null}
            Tải thêm
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function DataTableRow<TData>({
  columns,
  row,
}: {
  columns: AdvancedDataTableColumn<TData>[];
  row: TData;
}) {
  return (
    <TableRow>
      {columns.map((column) => (
        <TableCell
          key={column.id}
          className={cn(
            "border-b",
            alignClass(column.align),
            column.meta?.className,
          )}
        >
          {column.cell ? column.cell(row) : formatCell(getColumnValue(row, column))}
        </TableCell>
      ))}
    </TableRow>
  );
}

const MemoizedDataTableRow = memo(DataTableRow) as typeof DataTableRow;

function ColumnMenu<TData>({
  columns,
  hiddenColumnIds,
  enableColumnReorder,
  enableColumnVisibility,
  onMoveColumn,
  onSetColumnVisibility,
}: {
  columns: AdvancedDataTableColumn<TData>[];
  hiddenColumnIds: string[];
  enableColumnReorder: boolean;
  enableColumnVisibility: boolean;
  onMoveColumn: (columnId: string, offset: -1 | 1) => void;
  onSetColumnVisibility: (columnId: string, isVisible: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <Columns3 data-icon="inline-start" />
            Cột
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-72">
        {enableColumnVisibility ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
            {columns.map((column) =>
              column.enableHiding !== false ? (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={!hiddenColumnIds.includes(column.id)}
                  onCheckedChange={(checked) =>
                    onSetColumnVisibility(column.id, Boolean(checked))
                  }
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ) : null,
            )}
          </DropdownMenuGroup>
        ) : null}
        {enableColumnReorder ? (
          <>
            {enableColumnVisibility ? <DropdownMenuSeparator /> : null}
            <DropdownMenuGroup>
              <DropdownMenuLabel>Sắp xếp cột</DropdownMenuLabel>
              {columns.map((column, index) => (
                <DropdownMenuItem
                  key={`${column.id}-order`}
                  className="justify-between gap-2"
                  closeOnClick={false}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <GripVertical className="size-3 text-muted-foreground" />
                    <span className="truncate">{column.header}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Dịch cột sang trái"
                      disabled={index === 0}
                      onClick={(event) => {
                        event.preventDefault();
                        onMoveColumn(column.id, -1);
                      }}
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Dịch cột sang phải"
                      disabled={index === columns.length - 1}
                      onClick={(event) => {
                        event.preventDefault();
                        onMoveColumn(column.id, 1);
                      }}
                    >
                      <ChevronRight />
                    </Button>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction?: SortDirection;
}) {
  if (!active) {
    return <ArrowUpDown className="text-muted-foreground" />;
  }

  return direction === "asc" ? <ArrowUp /> : <ArrowDown />;
}

function mergeTableState(
  current: AdvancedDataTableState,
  patch?: AdvancedDataTableState,
) {
  return {
    ...DEFAULT_STATE,
    ...current,
    ...patch,
    columnFilters: {
      ...DEFAULT_STATE.columnFilters,
      ...current.columnFilters,
      ...patch?.columnFilters,
    },
    columnWidths: {
      ...DEFAULT_STATE.columnWidths,
      ...current.columnWidths,
      ...patch?.columnWidths,
    },
  };
}

function readStoredState(stateStorageKey: string | undefined) {
  if (!stateStorageKey || typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  const raw = window.localStorage.getItem(stateStorageKey);
  if (!raw) {
    return DEFAULT_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as AdvancedDataTableState;
    return mergeTableState(DEFAULT_STATE, stripSessionOnlyFields(parsed));
  } catch {
    window.localStorage.removeItem(stateStorageKey);
    return DEFAULT_STATE;
  }
}

function stripSessionOnlyFields(state: AdvancedDataTableState) {
  const next: AdvancedDataTableState = { ...state };
  delete next.showColumnFilters;
  return next;
}

function getColumnValue<TData>(
  row: TData,
  column: AdvancedDataTableColumn<TData>,
) {
  if (typeof column.accessor === "function") {
    return column.accessor(row);
  }

  if (column.accessor) {
    return row[column.accessor];
  }

  return undefined;
}

function compareValues(left: unknown, right: unknown) {
  const leftValue = normalizeComparable(left);
  const rightValue = normalizeComparable(right);

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return leftValue - rightValue;
  }

  return String(leftValue).localeCompare(String(rightValue), "vi", {
    numeric: true,
    sensitivity: "base",
  });
}

function normalizeComparable(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return String(value);
}

function normalizeFilter(value: unknown) {
  return String(value ?? "")
    .toLocaleLowerCase("vi")
    .trim();
}

function formatCell(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-muted-foreground">-</span>;
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("vi-VN").format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }

  return String(value);
}

function alignClass(align: AdvancedDataTableColumn<unknown>["align"]) {
  return align === "right"
    ? "text-right"
    : align === "center"
      ? "text-center"
      : "";
}

function textFromNode(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(textFromNode).join("");
  }

  if (isValidElement(node)) {
    const children = (node.props as { children?: ReactNode }).children;
    return textFromNode(children ?? null);
  }

  return "";
}

function estimateHeaderWidth(header: ReactNode, sortable: boolean): number {
  const text = textFromNode(header).trim();
  if (!text) {
    return 96;
  }
  const charWidth = 8;
  const padding = 32;
  const iconWidth = sortable ? 32 : 0;
  return Math.max(96, Math.ceil(text.length * charWidth) + padding + iconWidth);
}

function resolveRowId<TData>(
  row: TData,
  index: number,
  getRowId?: (row: TData, index: number) => string,
) {
  if (getRowId) {
    return getRowId(row, index);
  }

  const record = row as { id?: unknown; code?: unknown };
  return String(record.id ?? record.code ?? index);
}
