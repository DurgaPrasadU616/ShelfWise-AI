import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Card } from './card';
import { Skeleton } from './skeleton';
import { EmptyState } from './empty-state';
import { Input } from './input';
import { Button } from './button';

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function SortIcon({ dir }) {
  if (dir === 'asc') return <ChevronUp className="h-3.5 w-3.5" />;
  if (dir === 'desc') return <ChevronDown className="h-3.5 w-3.5" />;
  return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />;
}

export function DataTable({
  columns,
  data,
  keyField = 'id',
  loading = false,
  searchable = false,
  searchKeys = [],
  searchPlaceholder = 'Search…',
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  pageSize = 8,
  toolbar,
  emptyTitle = 'No records',
  emptyDescription = 'No records match the current filters.',
  emptyAction,
  emptyIcon,
  className,
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(1);
  const headerCheckRef = useRef(null);

  const searched = useMemo(() => {
    if (!searchable || !query.trim()) return data;
    const q = query.trim().toLowerCase();
    const keys = searchKeys.length ? searchKeys : columns.map((c) => c.key);
    return data.filter((row) => keys.some((k) => String(getPath(row, k) ?? '').toLowerCase().includes(q)));
  }, [data, query, searchable, searchKeys, columns]);

  const sorted = useMemo(() => {
    if (!sort) return searched;
    const col = columns.find((c) => c.key === sort.key);
    const getVal = col?.sortValue || ((r) => getPath(r, sort.key));
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...searched].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [searched, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const toggleSort = (col) => {
    if (!col.sortable) return;
    setSort((s) =>
      s?.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' },
    );
  };

  const allPageSelected = pageItems.length > 0 && pageItems.every((r) => selectedKeys.has(r[keyField]));
  const somePageSelected = pageItems.some((r) => selectedKeys.has(r[keyField]));

  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  const toggleAll = () => {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys);
    pageItems.forEach((r) => (allPageSelected ? next.delete(r[keyField]) : next.add(r[keyField])));
    onSelectionChange(next);
  };

  const toggleOne = (id) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const start = sorted.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, sorted.length);
  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <Card className={className}>
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-border/70 bg-muted/10 p-4 sm:flex-row sm:items-center">
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
          {searchable && (
            <div className="relative w-full sm:ml-auto sm:w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
                aria-label="Search"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-muted/30">
              {selectable && (
                <th className="w-12 px-4 py-3.5">
                  <input
                    ref={headerCheckRef}
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-primary"
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3.5 text-[11px] font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase',
                    col.align === 'right' && 'text-right',
                    col.headerClassName,
                  )}
                >
                  <button
                    className={cn(
                      'inline-flex items-center gap-1 transition-colors',
                      col.sortable ? 'cursor-pointer hover:text-foreground' : 'cursor-default',
                    )}
                    onClick={() => toggleSort(col)}
                    disabled={!col.sortable}
                  >
                    {col.header}
                    {col.sortable && <SortIcon dir={sort?.key === col.key ? sort.dir : null} />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              [...Array(pageSize)].map((_, i) => (
                <tr key={i} className="hover:bg-transparent">
                  {selectable && (
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-4" />
                    </td>
                  )}
                  {columns.map((c, j) => (
                    <td
                      key={c.key}
                      className={cn('px-4 py-3.5', c.align === 'right' && 'text-right')}
                    >
                      <Skeleton
                        className="h-4"
                        style={{
                          width: c.align === 'right' ? `${Math.max(36, 52 - (i * 3 + j * 7) % 18)}%` : `${Math.max(40, 88 - (j * 13 + i * 5) % 44)}%`,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4">
                  <EmptyState
                    icon={emptyIcon}
                    title={query ? `No results for “${query}”` : emptyTitle}
                    description={query ? 'Try a different search term or clear filters.' : emptyDescription}
                    action={emptyAction}
                    className="py-12"
                  />
                </td>
              </tr>
            ) : (
              pageItems.map((row) => (
                <tr
                  key={row[keyField]}
                  className={cn(
                    'transition-colors hover:bg-muted/40',
                    selectable && selectedKeys.has(row[keyField]) && 'bg-primary/5',
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedKeys.has(row[keyField])}
                        onChange={() => toggleOne(row[keyField])}
                        className="h-4 w-4 accent-primary"
                        aria-label={`Select row ${row[keyField]}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3.5', col.align === 'right' && 'text-right', col.className)}
                    >
                      {col.render ? col.render(row) : String(getPath(row, col.key) ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/70 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground tabular-nums">
          Showing{' '}
          <span className="font-mono">
            {start}–{end}
          </span>{' '}
          of <span className="font-mono">{sorted.length}</span>
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce(
                (acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push(null);
                  acc.push(p);
                  return acc;
                },
                [],
              )
              .map((p, i) =>
                p === null ? (
                  <span key={`gap-${i}`} className="px-1 font-mono text-xs text-muted-foreground/50">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                    className={cn(
                      'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-mono text-xs transition-colors',
                      p === page
                        ? 'bg-primary font-semibold text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {p}
                  </button>
                ),
              )}
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
