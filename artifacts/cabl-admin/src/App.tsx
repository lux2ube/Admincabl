import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Check,
  ChevronDown,
  Database,
  ExternalLink,
  FilePlus2,
  Hash,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ServerCog,
  Settings2,
  ShieldCheck,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import {
  getGetAdminDashboardQueryKey,
  getGetAdminMetadataQueryKey,
  getListAdminRowsQueryKey,
  useCreateAdminRow,
  useDeleteAdminRow,
  useGetAdminDashboard,
  useGetAdminMetadata,
  useListAdminRows,
  useSeedAdminData,
  useUpdateAdminRow,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import './index.css';

const queryClient = new QueryClient();
type Row = Record<string, unknown>;
type AdminTableLike = { key: string; label: string; primaryKey: string; columns: Array<{ key: string; label: string; type: string; nullable: boolean; primaryKey: boolean; generated?: boolean; references: string | null }> };

const rowId = (row: Row, table: { primaryKey: string }) => {
  const keys = table.primaryKey.split(',');
  return keys.length === 1
    ? String(row[keys[0]] ?? '')
    : keys.map((key) => `${key}=${String(row[key] ?? '')}`).join('|');
};

const iconForTable = (key: string) => {
  if (key.includes('order')) return Truck;
  if (key.includes('product') || key.includes('catalog')) return Package;
  if (key.includes('customer')) return Activity;
  if (key.includes('shipping') || key.includes('address')) return ExternalLink;
  return Database;
};

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const shortLabel = (value: string) =>
  value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: metadata, isLoading, isError } = useGetAdminMetadata();
  const groups = useMemo(() => {
    const tables = metadata?.tables ?? [];
    return tables.reduce<Record<string, typeof tables>>((acc, table) => {
      (acc[table.group] ||= []).push(table);
      return acc;
    }, {});
  }, [metadata]);

  return (
    <div className="cabl-noise min-h-[100dvh] bg-background">
      <button
        aria-label="Open navigation"
        data-testid="button-open-navigation"
        onClick={() => setMobileOpen(true)}
        className="focus-ring fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar text-sidebar-foreground shadow-lg md:hidden"
      >
        <Menu size={19} />
      </button>
      {mobileOpen && (
        <button
          aria-label="Close navigation overlay"
          data-testid="button-close-navigation-overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/30 md:hidden"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[88px] items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/" data-testid="link-brand-dashboard" onClick={() => setMobileOpen(false)} className="focus-ring flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-extrabold tracking-[-.08em] text-sidebar-primary-foreground">CB</span>
            <span>
              <span className="block text-[15px] font-extrabold tracking-[.18em]">CABL</span>
              <span className="mono mt-0.5 block text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/55">operations</span>
            </span>
          </Link>
          <button aria-label="Close navigation" data-testid="button-close-navigation" onClick={() => setMobileOpen(false)} className="focus-ring rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground md:hidden"><X size={18} /></button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5">
          <p className="mono mb-2 px-3 text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/40">Command center</p>
          <Link href="/" data-testid="link-dashboard" onClick={() => setMobileOpen(false)} className={`focus-ring mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors ${location === '/' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}>
            <LayoutDashboard size={16} /><span>Overview</span>
            {location === '/' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
          </Link>
           <Link href="/orders" data-testid="link-orders-workflow" onClick={() => setMobileOpen(false)} className={`focus-ring mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors ${location === '/orders' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}>
             <Truck size={16} /><span>Order workflow</span>
             {location === '/orders' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
           </Link>
          <Link href="/seed" data-testid="link-seed" onClick={() => setMobileOpen(false)} className={`focus-ring mb-5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors ${location === '/seed' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}>
            <ServerCog size={16} /><span>Data seeding</span>
            {location === '/seed' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
          </Link>
          <div className="flex items-center justify-between px-3">
            <p className="mono text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/40">Tables</p>
            <span className="mono text-[9px] text-sidebar-foreground/35" data-testid="text-table-count">{metadata?.tables.length ?? '···'}</span>
          </div>
          <div className="mt-3 space-y-5">
            {isLoading && <div className="space-y-2 px-3"><div className="skeleton h-8 bg-sidebar-accent" /><div className="skeleton h-8 bg-sidebar-accent" /><div className="skeleton h-8 bg-sidebar-accent" /></div>}
            {isError && <p data-testid="status-sidebar-error" className="px-3 text-xs leading-5 text-sidebar-foreground/55">Tables could not load. Refresh to try again.</p>}
            {Object.entries(groups).map(([group, tables]) => (
              <div key={group}>
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[.12em] text-sidebar-foreground/45">{group}</p>
                {tables.map((table) => {
                  const Icon = iconForTable(table.key);
                  const active = location === `/table/${table.key}`;
                  return (
                    <Link href={`/table/${table.key}`} key={table.key} data-testid={`link-table-${table.key}`} onClick={() => setMobileOpen(false)} className={`focus-ring group mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] transition-colors ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground font-bold' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}>
                      <Icon size={15} className="opacity-80" />
                      <span className="truncate">{table.label}</span>
                      <ArrowRight size={13} className={`ml-auto opacity-0 transition-opacity group-hover:opacity-70 ${active ? 'opacity-70' : ''}`} />
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/60 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary"><ShieldCheck size={17} /></div>
            <div className="min-w-0"><p className="text-xs font-bold">CABL internal</p><p className="mono mt-0.5 truncate text-[9px] text-sidebar-foreground/45">sync online / Yemen</p></div>
            <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" data-testid="status-api-online" />
          </div>
        </div>
      </aside>

      <main className="min-h-[100dvh] md:pl-[252px]">
        <header className="flex h-[88px] items-center justify-between border-b border-border/80 px-5 pl-[68px] md:px-10 md:pl-10">
          <div>
            <p className="mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">CABL / <span data-testid="text-current-route">{location === '/' ? 'overview' : location.slice(1).replace('/', ' / ')}</span></p>
            <p className="mt-1 text-xs font-semibold text-foreground/60">Keep every identifier in reach.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground sm:inline-flex"><span className="mr-2 h-1.5 w-1.5 self-center rounded-full bg-emerald-500" />API connected</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-xs font-extrabold text-primary" data-testid="avatar-operator">OP</div>
          </div>
        </header>
        <div className="mx-auto max-w-[1500px] p-5 md:p-10">{children}</div>
      </main>
    </div>
  );
}

function LoadingBlocks() {
  return <div className="space-y-6 page-enter" data-testid="loading-dashboard"><div className="skeleton h-10 w-64" /><div className="grid gap-4 md:grid-cols-4"><div className="skeleton h-32" /><div className="skeleton h-32" /><div className="skeleton h-32" /><div className="skeleton h-32" /></div><div className="skeleton h-80" /></div>;
}

function ErrorState({ label, onRetry }: { label: string; onRetry: () => void }) {
  return <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center" data-testid="state-error">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><RefreshCw size={20} /></div>
    <h2 className="text-sm font-extrabold">Could not load {label}</h2>
    <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">The shared API did not return a usable response. Retry without losing your place.</p>
    <button data-testid="button-retry" onClick={onRetry} className="focus-ring mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"><RefreshCw size={14} /> Try again</button>
  </div>;
}

function Dashboard() {
  const { data, isLoading, isError, refetch } = useGetAdminDashboard();
  const { data: metadata } = useGetAdminMetadata();
  if (isLoading) return <LoadingBlocks />;
  if (isError || !data) return <ErrorState label="dashboard summary" onRetry={() => refetch()} />;
  const topTables = [...(data.tableCounts ?? [])].sort((a, b) => b.count - a.count).slice(0, 6);
  const maxCount = Math.max(...topTables.map((item) => item.count), 1);
  return <div className="page-enter space-y-8" data-testid="page-dashboard">
    <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> live catalog</div><h1 className="max-w-2xl text-3xl font-extrabold tracking-[-.045em] text-primary md:text-[42px]">Good morning.<br /><span className="text-primary/45">Here is the shape of CABL.</span></h1><p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">A clear read on the store's records, orders, and the links that keep every handoff moving.</p></div>
      <Link href={metadata?.tables[0] ? `/table/${metadata.tables[0].key}` : '/seed'} data-testid="link-browse-catalog" className="focus-ring inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 lg:self-auto"><Boxes size={16} /> Browse records <ArrowRight size={15} /></Link>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="All records" value={data.totalRows} detail="across every table" icon={Database} accent="coral" testId="metric-total-rows" />
      <MetricCard label="Tables online" value={metadata?.tables.length ?? data.tableCounts.length} detail="metadata-defined" icon={LayoutDashboard} accent="teal" testId="metric-table-count" />
      <MetricCard label="Tracked orders" value={data.tableCounts.find((item) => item.table.includes('order'))?.count ?? '—'} detail="in the order ledger" icon={Truck} accent="sand" testId="metric-orders" />
      <MetricCard label="System status" value="Ready" detail="API connection healthy" icon={ShieldCheck} accent="ink" testId="metric-system-status" />
    </section>
    <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between border-b border-border px-5 py-5 md:px-6"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">latest movement</p><h2 className="mt-1 text-base font-extrabold">Recent orders</h2></div><span className="rounded-md bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground" data-testid="text-recent-orders-count">{data.recentOrders.length} shown</span></div>
        {data.recentOrders.length === 0 ? <EmptyState title="No order movement yet" detail="When orders enter the ledger, their latest activity will appear here." testId="empty-recent-orders" /> : <div className="scrollbar-thin overflow-x-auto"><table className="w-full min-w-[520px] text-left"><thead><tr className="border-b border-border/80 text-[10px] uppercase tracking-[.12em] text-muted-foreground"><th className="px-6 py-3 font-bold">Reference</th><th className="px-6 py-3 font-bold">Customer</th><th className="px-6 py-3 font-bold">Status</th><th className="px-6 py-3 text-right font-bold">Value</th></tr></thead><tbody>{data.recentOrders.map((order, index) => <tr key={index} data-testid={`row-recent-order-${index}`} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40"><td className="px-6 py-4"><span className="mono text-xs font-medium text-primary" data-testid={`text-recent-order-id-${index}`}>{displayValue(order.id ?? order.order_id ?? order.reference ?? `ORD-${index + 1}`)}</span><span className="mt-1 block text-[10px] text-muted-foreground">{displayValue(order.created_at ?? order.createdAt ?? 'recent')}</span></td><td className="max-w-[160px] truncate px-6 py-4 text-xs font-semibold">{displayValue(order.customer_name ?? order.customerName ?? order.customer_id)}</td><td className="px-6 py-4"><span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-secondary-foreground">{displayValue(order.status ?? 'queued')}</span></td><td className="px-6 py-4 text-right mono text-xs font-medium">{displayValue(order.total ?? order.amount ?? order.total_amount)}</td></tr>)}</tbody></table></div>}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] md:p-6">
        <div className="flex items-start justify-between"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">record distribution</p><h2 className="mt-1 text-base font-extrabold">Where the data lives</h2></div><Hash size={18} className="text-accent" /></div>
        <div className="mt-7 space-y-5">{topTables.length === 0 ? <EmptyState title="No tables reported" detail="Seed reference data to populate the catalog." testId="empty-table-counts" /> : topTables.map((item) => <Link href={`/table/${item.table}`} key={item.table} data-testid={`link-table-distribution-${item.table}`} className="group block"><div className="mb-2 flex items-center justify-between gap-4 text-xs"><span className="truncate font-bold group-hover:text-accent">{item.label}</span><span className="mono text-[11px] text-muted-foreground">{item.count.toLocaleString()}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700 group-hover:bg-accent" style={{ width: `${Math.max((item.count / maxCount) * 100, 4)}%` }} /></div></Link>)}</div>
        <div className="mt-8 flex items-center gap-2 border-t border-border pt-5 text-[11px] leading-5 text-muted-foreground"><Activity size={14} className="shrink-0 text-accent" /> Counts are read directly from the shared service.</div>
      </div>
    </section>
  </div>;
}

function MetricCard({ label, value, detail, icon: Icon, accent, testId }: { label: string; value: string | number; detail: string; icon: typeof Database; accent: string; testId: string }) {
  const accentClass = { coral: 'bg-accent/10 text-accent', teal: 'bg-secondary text-secondary-foreground', sand: 'bg-[#e9dfcc] text-[#79613e]', ink: 'bg-primary/10 text-primary' }[accent] ?? 'bg-muted text-primary';
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]" data-testid={testId}><div className="flex items-start justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentClass}`}><Icon size={17} /></div><span className="mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">CABL</span></div><p className="mt-6 text-2xl font-extrabold tracking-[-.04em] text-primary" data-testid={`${testId}-value`}>{typeof value === 'number' ? value.toLocaleString() : value}</p><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</p><p className="mt-3 text-[10px] text-muted-foreground/80">{detail}</p></div>;
}

function EmptyState({ title, detail, testId }: { title: string; detail: string; testId: string }) {
  return <div className="flex flex-col items-center justify-center px-6 py-16 text-center" data-testid={testId}><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Database size={18} /></div><p className="text-sm font-bold">{title}</p><p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">{detail}</p></div>;
}

function TablePage() {
  const params = useParams<{ table: string }>();
  const tableName = params.table ?? '';
  const { data: metadata, isLoading: metadataLoading } = useGetAdminMetadata();
  const table = metadata?.tables.find((item) => item.key === tableName);
  const [search, setSearch] = useState('');
  const [editingRow, setEditingRow] = useState<Row | null | undefined>(undefined);
  const [notice, setNotice] = useState('');
  const listParams = useMemo(() => ({ search: search.trim() || undefined, limit: 50, offset: 0 }), [search]);
  const rowsQuery = useListAdminRows(tableName, listParams, { query: { queryKey: getListAdminRowsQueryKey(tableName, listParams) } });
  const deleteRow = useDeleteAdminRow();
  const queryClient = useQueryClient();

  if (metadataLoading) return <LoadingBlocks />;
  if (!table) return <div className="page-enter"><ErrorState label={`table "${tableName}"`} onRetry={() => queryClient.invalidateQueries({ queryKey: getGetAdminMetadataQueryKey() })} /></div>;
  const rows = (rowsQuery.data?.rows ?? []) as Row[];
   const primaryColumn = table.columns.find((column) => column.key === table.primaryKey.split(',')[0]);
  const handleDelete = (row: Row) => {
     const id = rowId(row, table);
    const relationWarning = table.relations.length > 0
      ? ` This table has ${table.relations.length} defined relationship${table.relations.length === 1 ? '' : 's'}; linked records may prevent deletion.`
      : '';
    if (!id || !window.confirm(`Delete ${table.label} ${id}? This cannot be undone.${relationWarning}`)) return;
    deleteRow.mutate({ table: tableName, id }, {
      onSuccess: () => {
        setNotice('Record deleted.');
        queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey(tableName) });
        queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
      },
      onError: () => setNotice('Delete failed. The record was not changed.'),
    });
  };
  return <div className="page-enter space-y-6" data-testid={`page-table-${tableName}`}>
    <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground"><Link href="/" data-testid="link-breadcrumb-overview" className="focus-ring hover:text-accent">Overview</Link><ChevronDown size={12} className="-rotate-90" /><span>{table.group}</span></div><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Database size={20} /></div><div><h1 className="text-3xl font-extrabold tracking-[-.045em] text-primary" data-testid="text-table-title">{table.label}</h1><p className="mono mt-1 text-[10px] uppercase tracking-[.12em] text-muted-foreground">{table.key} · {table.columns.length} columns · PK {table.primaryKey}</p></div></div></div>
      <button data-testid="button-add-row" onClick={() => setEditingRow(null)} className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-xs font-extrabold text-accent-foreground shadow-sm transition-transform hover:-translate-y-0.5"><Plus size={16} /> Add record</button>
    </section>
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input data-testid="input-table-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${table.label.toLowerCase()}…`} className="focus-ring h-10 w-full rounded-xl border-0 bg-muted/60 pl-10 pr-3 text-xs font-medium outline-none placeholder:text-muted-foreground/70" /></div><span className="mono px-3 text-[10px] text-muted-foreground" data-testid="text-row-total">{rowsQuery.data?.total ?? 0} total records</span><button aria-label="Refresh table" data-testid="button-refresh-table" onClick={() => rowsQuery.refetch()} className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-primary"><RefreshCw size={15} className={rowsQuery.isFetching ? 'animate-spin' : ''} /></button></div>
    {notice && <div data-testid="status-table-notice" className="flex items-center justify-between rounded-xl border border-secondary bg-secondary/50 px-4 py-3 text-xs font-semibold text-secondary-foreground"><span className="flex items-center gap-2"><Check size={14} /> {notice}</span><button data-testid="button-dismiss-notice" onClick={() => setNotice('')}><X size={14} /></button></div>}
     {rowsQuery.isLoading ? <div className="rounded-2xl border border-border bg-card p-5"><div className="space-y-3">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="skeleton h-11 w-full" />)}</div></div> : rowsQuery.isError ? <ErrorState label={`${table.label} records`} onRetry={() => rowsQuery.refetch()} /> : rows.length === 0 ? <div className="rounded-2xl border border-border bg-card"><EmptyState title={search ? 'No matching records' : `No ${table.label.toLowerCase()} yet`} detail={search ? 'Try a shorter search or clear the filter.' : 'Create the first record to start building this ledger.'} testId="empty-table-rows" /></div> : <div className="scrollbar-thin overflow-hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]"><table className="w-full min-w-[780px] text-left"><thead className="bg-muted/55"><tr className="border-b border-border text-[10px] uppercase tracking-[.1em] text-muted-foreground"><th className="w-20 px-5 py-3 font-bold">#</th>{table.columns.map((column) => <th key={column.key} className="px-4 py-3 font-bold"><span className="inline-flex items-center gap-1.5">{column.primaryKey && <ShieldCheck size={12} className="text-accent" />}{column.label}</span></th>)}<th className="w-24 px-4 py-3 text-right font-bold">Actions</th></tr></thead><tbody>{rows.map((row, index) => { const id = rowId(row, table) || String(index); return <tr key={id} data-testid={`row-${tableName}-${id}`} className="border-b border-border/65 last:border-0 hover:bg-muted/35"><td className="px-5 py-4 mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, '0')}</td>{table.columns.map((column) => <td key={column.key} data-testid={`cell-${tableName}-${id}-${column.key}`} className="max-w-[230px] px-4 py-4 text-xs font-medium"><span className={`${table.primaryKey.split(',').includes(column.key) ? 'mono font-bold text-primary' : ''} block truncate`} title={displayValue(row[column.key])}>{column.references ? <RelationValue value={row[column.key]} reference={column.references} /> : displayValue(row[column.key])}</span></td>)}<td className="px-4 py-4"><div className="flex justify-end gap-1"><button aria-label={`Edit ${id}`} data-testid={`button-edit-row-${id}`} onClick={() => setEditingRow(row)} className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"><Pencil size={14} /></button><button aria-label={`Delete ${id}`} data-testid={`button-delete-row-${id}`} onClick={() => handleDelete(row)} disabled={deleteRow.isPending} className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"><Trash2 size={14} /></button></div></td></tr>; })}</tbody></table></div>}
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-accent" /> Primary key: <strong className="mono text-foreground">{primaryColumn?.label ?? table.primaryKey}</strong></span><span className="flex items-center gap-1.5"><Settings2 size={13} /> Changes sync to the shared API</span></div>
    {editingRow !== undefined && <RowDialog table={table} row={editingRow} onClose={() => setEditingRow(undefined)} onSaved={() => { setEditingRow(undefined); setNotice(editingRow ? 'Record updated.' : 'Record created.'); queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey(tableName) }); queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() }); }} />}
  </div>;
}

function RelationValue({ value, reference }: { value: unknown; reference: string }) {
  const [targetTable, targetColumn] = reference.split('.');
  const rawValue = displayValue(value);
  const params = useMemo(() => ({ search: rawValue === '—' ? undefined : rawValue, limit: 5, offset: 0 }), [rawValue]);
  const query = useListAdminRows(targetTable, params, {
    query: { enabled: rawValue !== '—', queryKey: getListAdminRowsQueryKey(targetTable, params) },
  });
  const match = ((query.data?.rows ?? []).find((row) => String((row as Row)[targetColumn]) === rawValue) ?? query.data?.rows?.[0]) as Row | undefined;
  const displayColumn = match
    ? Object.keys(match).find((key) => /(^|_)(name|title|email|code)$/.test(key) || key.endsWith('_name'))
    : undefined;
  return <span data-testid={`relation-value-${targetTable}-${String(value)}`} title={`${reference}: ${rawValue}`}>
    {match ? `${relationOptionLabel(match, displayColumn)} · ` : ''}{rawValue}
  </span>;
}

function relationOptionLabel(row: Row, preferredColumn?: string) {
  if (preferredColumn && row[preferredColumn] !== undefined && row[preferredColumn] !== null) {
    return displayValue(row[preferredColumn]);
  }
  const firstName = row.first_name;
  const lastName = row.last_name;
  if (firstName || lastName) return `${String(firstName ?? '')} ${String(lastName ?? '')}`.trim();
  const displayColumn = Object.keys(row).find((key) => /(^|_)(name|title|email|code|label)$/.test(key) || key.endsWith('_name'));
  return displayColumn ? displayValue(row[displayColumn]) : displayValue(row.id);
}

function RowDialog({ table, row, onClose, onSaved }: { table: AdminTableLike; row: Row | null; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState<Row>(() => row ? { ...row } : {});
  const [formError, setFormError] = useState('');
  const createRow = useCreateAdminRow();
  const updateRow = useUpdateAdminRow();
  const isEditing = Boolean(row);
  const isPending = createRow.isPending || updateRow.isPending;
  const updateValue = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    const parsed: Row = {};
    for (const column of table.columns) {
      if (column.generated) continue;
      const raw = values[column.key];
      if ((raw === '' || raw === undefined) && column.nullable) { parsed[column.key] = null; continue; }
      if (raw === '' || raw === undefined) { setFormError(`${column.label} is required.`); return; }
      if (column.type === 'number') parsed[column.key] = Number(raw);
      else if (column.type === 'boolean') parsed[column.key] = Boolean(raw);
      else if (column.type === 'json' || column.type === 'array') {
        try { parsed[column.key] = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { setFormError(`${column.label} must be valid JSON.`); return; }
      } else parsed[column.key] = raw;
    }
    const onError = () => setFormError('The API rejected this change. Check the values and try again.');
     if (isEditing && row) updateRow.mutate({ table: table.key, id: rowId(row, table), data: { values: parsed } }, { onSuccess: onSaved, onError });
    else createRow.mutate({ table: table.key, data: { values: parsed } }, { onSuccess: onSaved, onError });
  };
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/35 p-0 sm:items-center sm:p-5" data-testid="dialog-row"><div className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-card/95 px-6 py-5 backdrop-blur"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-accent">{isEditing ? 'edit record' : 'new record'}</p><h2 className="mt-1 text-xl font-extrabold tracking-[-.03em]">{isEditing ? `Update ${table.label}` : `Add to ${table.label}`}</h2><p className="mt-1 text-xs text-muted-foreground">{table.columns.filter((column) => !column.generated).length} editable fields · generated values stay protected</p></div><button aria-label="Close record dialog" data-testid="button-close-row-dialog" onClick={onClose} className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted"><X size={17} /></button></div><form onSubmit={submit} className="space-y-5 p-6"><div className="grid gap-5 sm:grid-cols-2">{table.columns.filter((column) => !column.generated).map((column) => <Field key={column.key} column={column} value={values[column.key]} onChange={(value) => updateValue(column.key, value)} />)}</div>{formError && <div data-testid="status-form-error" className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">{formError}</div>}<div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end"><button type="button" data-testid="button-cancel-row" onClick={onClose} className="focus-ring h-11 rounded-xl border border-border px-5 text-xs font-bold text-muted-foreground hover:bg-muted">Cancel</button><button type="submit" data-testid="button-save-row" disabled={isPending} className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{isPending && <LoaderCircle size={14} className="animate-spin" />}{isEditing ? 'Save changes' : 'Create record'}</button></div></form></div></div>;
}

function Field({ column, value, onChange }: { column: { key: string; label: string; type: string; nullable: boolean; primaryKey: boolean; references: string | null }; value: unknown; onChange: (value: unknown) => void }) {
  const testId = `input-field-${column.key}`;
  const label = <label htmlFor={testId} className="mb-2 flex items-center justify-between text-[11px] font-bold text-primary"><span>{column.label}{!column.nullable && <span className="ml-1 text-accent">*</span>}</span><span className="mono text-[9px] font-normal text-muted-foreground">{column.type}</span></label>;
  if (column.type === 'boolean') return <div className="sm:col-span-1"><span className="mb-2 flex items-center justify-between text-[11px] font-bold text-primary">{column.label}<span className="mono text-[9px] font-normal text-muted-foreground">boolean</span></span><button type="button" id={testId} data-testid={testId} aria-pressed={Boolean(value)} onClick={() => onChange(!value)} className={`flex h-11 w-full items-center justify-between rounded-xl border px-3 text-xs font-semibold ${value ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-input bg-background text-muted-foreground'}`}><span>{value ? 'Enabled' : 'Disabled'}</span><span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${value ? 'bg-secondary-foreground' : 'bg-muted-foreground/30'}`}><span className={`block h-4 w-4 rounded-full bg-card transition-transform ${value ? 'translate-x-4' : ''}`} /></span></button></div>;
  if (column.references) return <RelationField column={column} value={value} onChange={onChange} label={label} testId={testId} />;
  const textValue = value === undefined || value === null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return <div className="sm:col-span-1">{label}{column.type === 'json' || column.type === 'array' ? <textarea id={testId} data-testid={testId} value={textValue} onChange={(event) => onChange(event.target.value)} placeholder={column.type === 'array' ? '["value"]' : '{"key":"value"}'} rows={3} className="focus-ring w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-xs outline-none placeholder:text-muted-foreground/55" /> : <input id={testId} data-testid={testId} type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'} value={textValue} onChange={(event) => onChange(event.target.value)} placeholder={column.references ? `References ${column.references}` : `Enter ${column.label.toLowerCase()}`} className="focus-ring h-11 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none placeholder:text-muted-foreground/55" />}</div>;
}

function RelationField({
  column,
  value,
  onChange,
  label,
  testId,
}: {
  column: { type: string; nullable: boolean; references: string };
  value: unknown;
  onChange: (value: unknown) => void;
  label: ReactNode;
  testId: string;
}) {
  const [targetTable, targetColumn] = column.references.split('.');
  const params = useMemo(() => ({ limit: 100, offset: 0 }), [targetTable]);
  const query = useListAdminRows(targetTable, params, {
    query: { enabled: Boolean(targetTable && targetColumn), queryKey: getListAdminRowsQueryKey(targetTable, params) },
  });
  const options = (query.data?.rows ?? []) as Row[];
  const selectedValue = value === null || value === undefined ? '' : String(value);

  return <div className="sm:col-span-1">
    {label}
    <select
      id={testId}
      data-testid={testId}
      value={selectedValue}
      disabled={query.isLoading || query.isError}
      onChange={(event) => onChange(event.target.value === '' ? (column.nullable ? null : '') : event.target.value)}
      className="focus-ring h-11 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      {column.nullable && <option value="">— None —</option>}
      {query.isLoading && <option value="">Loading linked records…</option>}
      {query.isError && <option value="">Unable to load linked records</option>}
      {!query.isLoading && !query.isError && options.length === 0 && <option value="">No linked records available</option>}
      {options.map((option) => <option key={String(option[targetColumn])} value={String(option[targetColumn])}>{relationOptionLabel(option, Object.keys(option).find((key) => key !== targetColumn && /(^|_)(name|title|email|code|label)$/.test(key) || key.endsWith('_name')))}</option>)}
    </select>
    <p className="mt-1.5 text-[10px] text-muted-foreground">{column.references}</p>
  </div>;
}

function OrdersPage() {
  const listParams = useMemo(() => ({ limit: 100, offset: 0 }), []);
  const ordersQuery = useListAdminRows('orders', listParams);
  const statusesQuery = useListAdminRows('order_statuses', listParams);
  const customersQuery = useListAdminRows('customers', listParams);
  const itemsQuery = useListAdminRows('order_items', listParams);
  const shippingsQuery = useListAdminRows('shippings', listParams);
  const updateOrder = useUpdateAdminRow();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const orders = (ordersQuery.data?.rows ?? []) as Row[];
  const statuses = (statusesQuery.data?.rows ?? []) as Row[];
  const customers = (customersQuery.data?.rows ?? []) as Row[];
  const items = (itemsQuery.data?.rows ?? []) as Row[];
  const shippings = (shippingsQuery.data?.rows ?? []) as Row[];
  const selected = orders.find((order) => String(order.id) === selectedId) ?? null;
  const statusName = (id: unknown) => String(statuses.find((status) => String(status.id) === String(id))?.status_name ?? 'جديد');
  const customerName = (id: unknown) => {
    const customer = customers.find((item) => String(item.id) === String(id));
    return customer ? `${String(customer.first_name ?? '')} ${String(customer.last_name ?? '')}`.trim() || String(customer.email ?? id) : String(id ?? '—');
  };
  const saveOrderLifecycle = (order: Row, statusId: number) => {
    const now = new Date().toISOString();
    const values: Row = { order_status_id: statusId };
    if (statusId >= 2 && !order.order_approved_at) values.order_approved_at = now;
    if (statusId >= 3 && !order.order_delivered_carrier_date) values.order_delivered_carrier_date = now;
    if (statusId >= 4 && !order.order_delivered_customer_date) values.order_delivered_customer_date = now;
    updateOrder.mutate({ table: 'orders', id: String(order.id), data: { values } }, {
      onSuccess: () => {
        setNotice(`تم تحديث الطلب ${String(order.id)} إلى ${statusName(statusId)}.`);
        queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('orders') });
        queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
      },
      onError: () => setNotice('تعذر تحديث دورة حياة الطلب.'),
    });
  };
  const saveShipping = (item: Row, shippingId: number) => {
    updateOrder.mutate({ table: 'order_items', id: String(item.id), data: { values: { shipping_id: shippingId } } }, {
      onSuccess: () => {
        setNotice(`تم تحديث طريقة شحن العنصر في الطلب ${String(item.order_id)}.`);
        queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('order_items') });
      },
      onError: () => setNotice('تعذر تحديث طريقة الشحن.'),
    });
  };
  if (ordersQuery.isLoading || statusesQuery.isLoading) return <LoadingBlocks />;
  if (ordersQuery.isError) return <ErrorState label="order workflow" onRetry={() => ordersQuery.refetch()} />;
  return <div className="page-enter space-y-6" data-testid="page-orders-workflow">
    <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-accent"><Truck size={13} /> fulfillment control</div><h1 className="text-3xl font-extrabold tracking-[-.045em] text-primary md:text-[42px]">Order workflow.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Move each order from new to preparation, carrier handoff, and customer delivery. Every transition writes to the shared order ledger.</p></div>
      <Link href="/table/customers" className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-xs font-bold text-primary hover:bg-muted"><Activity size={15} /> Customer records <ArrowRight size={14} /></Link>
    </section>
    {notice && <div className="flex items-center justify-between rounded-xl border border-secondary bg-secondary/50 px-4 py-3 text-xs font-semibold text-secondary-foreground" data-testid="status-order-notice"><span className="flex items-center gap-2"><Check size={14} /> {notice}</span><button onClick={() => setNotice('')}><X size={14} /></button></div>}
    <section className="grid gap-4 sm:grid-cols-3">
      {statuses.slice(0, 3).map((status) => <div key={String(status.id)} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"><p className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{String(status.status_name)}</p><p className="mt-3 text-2xl font-extrabold text-primary">{orders.filter((order) => String(order.order_status_id) === String(status.id)).length}</p><p className="mt-1 text-[11px] text-muted-foreground">orders in this stage</p></div>)}
    </section>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-5"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">live order ledger</p><h2 className="mt-1 text-base font-extrabold">Customer orders</h2></div><span className="mono text-[10px] text-muted-foreground">{orders.length} total</span></div>
        {orders.length === 0 ? <EmptyState title="No orders yet" detail="Orders created by the storefront will appear here." testId="empty-order-workflow" /> : <div className="scrollbar-thin overflow-x-auto"><table className="w-full min-w-[690px] text-left"><thead><tr className="border-b border-border/80 text-[10px] uppercase tracking-[.1em] text-muted-foreground"><th className="px-5 py-3">Reference</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3 text-right">Open</th></tr></thead><tbody>{orders.map((order) => <tr key={String(order.id)} className={`border-b border-border/60 last:border-0 hover:bg-muted/35 ${selectedId === String(order.id) ? 'bg-muted/50' : ''}`}><td className="px-5 py-4 mono text-xs font-bold text-primary">{String(order.id)}</td><td className="px-4 py-4 text-xs font-semibold">{customerName(order.customer_id)}</td><td className="px-4 py-4"><select aria-label={`Status for ${String(order.id)}`} value={String(order.order_status_id ?? '')} onChange={(event) => saveOrderLifecycle(order, Number(event.target.value))} disabled={updateOrder.isPending} className="h-8 rounded-lg border border-border bg-background px-2 text-[11px] font-bold"><option value="">جديد</option>{statuses.map((status) => <option key={String(status.id)} value={String(status.id)}>{String(status.status_name)}</option>)}</select></td><td className="px-4 py-4 text-[11px] text-muted-foreground">{displayValue(order.created_at)}</td><td className="px-4 py-4 text-right"><button onClick={() => setSelectedId(String(order.id))} className="focus-ring rounded-lg border border-border px-3 py-2 text-[10px] font-bold hover:bg-muted" data-testid={`button-open-order-${String(order.id)}`}>Details</button></td></tr>)}</tbody></table></div>}
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] md:p-6">
        {!selected ? <div className="flex min-h-[250px] flex-col items-center justify-center text-center"><Truck size={22} className="text-accent" /><p className="mt-4 text-sm font-bold">Select an order</p><p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">Review the customer handoff dates and shipping items here.</p></div> : <div><div className="flex items-start justify-between gap-3"><div><p className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">order detail</p><h2 className="mt-1 text-lg font-extrabold">{String(selected.id)}</h2><p className="mt-1 text-xs text-muted-foreground">{customerName(selected.customer_id)}</p></div><Package size={20} className="text-accent" /></div><div className="mt-6 space-y-3 text-xs"><div className="flex justify-between border-b border-border pb-3"><span className="text-muted-foreground">Current status</span><strong>{statusName(selected.order_status_id)}</strong></div><div className="flex justify-between border-b border-border pb-3"><span className="text-muted-foreground">Approved</span><strong>{displayValue(selected.order_approved_at)}</strong></div><div className="flex justify-between border-b border-border pb-3"><span className="text-muted-foreground">Carrier handoff</span><strong>{displayValue(selected.order_delivered_carrier_date)}</strong></div><div className="flex justify-between border-b border-border pb-3"><span className="text-muted-foreground">Customer delivery</span><strong>{displayValue(selected.order_delivered_customer_date)}</strong></div></div><div className="mt-6"><p className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">shipping items</p>{items.filter((item) => String(item.order_id) === String(selected.id)).map((item) => <div key={String(item.id)} className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3 text-xs"><span>{String(item.product_id).slice(0, 12)}… × {String(item.quantity)}</span><select aria-label={`Shipping for item ${String(item.id)}`} value={String(item.shipping_id ?? '')} onChange={(event) => saveShipping(item, Number(event.target.value))} disabled={updateOrder.isPending} className="h-8 max-w-[150px] rounded-lg border border-border bg-background px-2 text-[10px] font-bold"><option value="">Select shipping</option>{shippings.map((shipping) => <option key={String(shipping.id)} value={String(shipping.id)}>{String(shipping.name)}</option>)}</select></div>)}{items.filter((item) => String(item.order_id) === String(selected.id)).length === 0 && <p className="mt-3 text-xs text-muted-foreground">No line items loaded for this order.</p>}</div><Link href={`/table/orders`} className="mt-6 inline-flex items-center gap-2 text-[11px] font-bold text-accent hover:underline">Edit full record <ArrowRight size={13} /></Link></div>}
      </section>
    </div>
  </div>;
}

function SeedPage() {
  const mutation = useSeedAdminData();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<{ seeded: boolean; inserted: number; tables: Record<string, number> } | null>(null);
  const [error, setError] = useState('');
  const runSeed = () => {
    setError('');
    mutation.mutate(undefined, { onSuccess: (data) => { setResult(data); queryClient.invalidateQueries({ queryKey: getGetAdminMetadataQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() }); }, onError: () => setError('The seed request did not complete. Try again when the API is available.') });
  };
  return <div className="page-enter mx-auto max-w-4xl space-y-7" data-testid="page-seed">
    <section><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary bg-secondary/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-secondary-foreground"><ServerCog size={13} /> controlled setup</div><h1 className="text-3xl font-extrabold tracking-[-.045em] text-primary md:text-[42px]">Seed the CABL ledger.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Load the reference catalog and relationships the team needs to start working. This action is safe to repeat; the service owns its insert rules.</p></section>
    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border border-border bg-primary p-7 text-primary-foreground shadow-[var(--shadow-soft)]"><div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Database size={22} /></div><span className="mono text-[10px] uppercase tracking-[.16em] text-primary-foreground/50">POST /api/admin/seed</span></div><h2 className="mt-14 text-2xl font-extrabold tracking-[-.04em]">Bring the workspace online.</h2><p className="mt-3 max-w-sm text-sm leading-6 text-primary-foreground/60">Reference rows, catalog products, and their relationships will be written by the shared API.</p><button data-testid="button-run-seed" onClick={runSeed} disabled={mutation.isPending} className="focus-ring mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-xs font-extrabold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60">{mutation.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowRight size={15} />}{mutation.isPending ? 'Seeding records…' : 'Run seed action'}</button></div><div className="rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]"><p className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">What happens next</p><div className="mt-6 space-y-5">{['Metadata stays the source of truth', 'Existing identifiers remain visible', 'Dashboard counts refresh automatically'].map((text, index) => <div key={text} className="flex gap-3"><span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-bold text-muted-foreground">0{index + 1}</span><p className="pt-1 text-xs font-semibold leading-5">{text}</p></div>)}</div></div></div>
    {error && <div data-testid="status-seed-error" className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">{error}</div>}
    {result && <div className="rounded-2xl border border-secondary bg-secondary/40 p-6" data-testid="panel-seed-result"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-sm font-extrabold text-secondary-foreground"><Check size={17} /> Seed action complete</div><p className="mt-1 text-xs text-secondary-foreground/70">{result.inserted.toLocaleString()} records inserted across the workspace.</p></div><span className="mono rounded-lg bg-card/60 px-2.5 py-1.5 text-[10px] font-bold text-secondary-foreground">{result.seeded ? 'seeded' : 'no changes'}</span></div><div className="mt-5 flex flex-wrap gap-2">{Object.entries(result.tables).map(([table, count]) => <Link key={table} href={`/table/${table}`} data-testid={`link-seeded-table-${table}`} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-secondary/60 bg-card/55 px-3 py-2 text-[10px] font-bold text-secondary-foreground hover:bg-card"><span>{shortLabel(table)}</span><span className="mono opacity-65">{count}</span></Link>)}</div></div>}
  </div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch><Route path="/" component={Dashboard} /><Route path="/orders" component={OrdersPage} /><Route path="/table/:table" component={TablePage} /><Route path="/seed" component={SeedPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></QueryClientProvider>;
}