"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, BellRing, Building2, CircleAlert, Clock3, Database, MailCheck, MapPinned, Search, ShieldCheck, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Notification } from "./page";

const PAGE_SIZE = 50;
type MarketFilter = "all" | "gurugram" | "faridabad" | "noida" | "other";

function getMarket(item: Notification): Exclude<MarketFilter, "all"> {
  const place = `${item.city || ""} ${item.location || ""}`.toLocaleLowerCase();
  if (place.includes("gurugram") || place.includes("gurgaon")) return "gurugram";
  if (place.includes("faridabad")) return "faridabad";
  if (place.includes("noida") || place.includes("gautam buddha nagar") || place.includes("gautam buddh nagar")) return "noida";
  return "other";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function StatusBadge({ status }: { status: Notification["email_status"] }) {
  const styles = {
    sent: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    failed: "border-red-200 bg-red-50 text-red-700",
    baseline: "border-slate-200 bg-slate-100 text-slate-600",
  }[status];
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${styles}`}>{status}</span>;
}

export default function Dashboard({ initialNotifications, viewerEmail, signOutPath }: { initialNotifications: Notification[]; viewerEmail: string; signOutPath: string }) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [market, setMarket] = useState<MarketFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return initialNotifications.filter((item) => {
      const searchable = [item.project_name, item.rera_number, item.developer, item.city, item.location].join(" ").toLocaleLowerCase();
      return (!needle || searchable.includes(needle)) && (source === "all" || item.source === source) && (status === "all" || item.email_status === status) && (market === "all" || getMarket(item) === market);
    });
  }, [initialNotifications, market, query, source, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const sources = Array.from(new Set(initialNotifications.map((item) => item.source))).sort();
  const stats = {
    total: initialNotifications.length,
    sent: initialNotifications.filter((item) => item.email_status === "sent").length,
    pending: initialNotifications.filter((item) => item.email_status === "pending").length,
    failed: initialNotifications.filter((item) => item.email_status === "failed").length,
    priority: initialNotifications.filter((item) => item.priority).length,
    gurugram: initialNotifications.filter((item) => getMarket(item) === "gurugram").length,
    faridabad: initialNotifications.filter((item) => getMarket(item) === "faridabad").length,
  };

  const selectMarket = (value: MarketFilter) => {
    setMarket(value);
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-[#f2f5f8] text-[#14213a]">
      <header className="bg-[radial-gradient(circle_at_80%_0%,#234f78_0%,#102842_46%,#0a192a_100%)] px-5 pb-24 pt-8 text-white sm:px-10 lg:px-[max(2.5rem,calc((100vw-1500px)/2))]">
        <div className="mx-auto flex max-w-[1500px] items-start justify-between gap-6">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-100"><ShieldCheck className="size-4 text-emerald-300" /> Private & authenticated</div>
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">RERA Mail Admin</h1>
            <p className="mt-2 text-base text-slate-300">Haryana · Noida · Greater Noida · Yamuna Expressway</p>
          </div>
          <div className="hidden text-right sm:block"><p className="text-sm font-semibold">{viewerEmail}</p><a href={signOutPath} target="_top" className="mt-2 inline-block text-sm text-blue-200 hover:text-white">Sign out</a></div>
        </div>
      </header>

      <div className="mx-auto -mt-16 max-w-[1500px] px-3 pb-12 sm:px-6">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7" aria-label="Notification summary">
          {[
            ["All projects", stats.total, Database, "text-blue-700"], ["Emails sent", stats.sent, MailCheck, "text-emerald-700"],
            ["Pending", stats.pending, Clock3, "text-amber-700"], ["Failed", stats.failed, CircleAlert, "text-red-700"],
            ["Priority", stats.priority, Star, "text-violet-700"],
          ].map(([label, value, Icon, tone]) => (
            <article key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,33,52,.08)] sm:p-5">
              <div className={`mb-5 inline-flex rounded-lg bg-slate-100 p-2 ${tone}`}><Icon className="size-5" /></div>
              <p className="text-sm font-semibold text-slate-500">{label as string}</p><strong className="mt-1 block font-serif text-3xl">{value as number}</strong>
            </article>
          ))}
          {[
            ["Gurugram", stats.gurugram, Building2, "text-cyan-700", "gurugram"],
            ["Faridabad", stats.faridabad, MapPinned, "text-fuchsia-700", "faridabad"],
          ].map(([label, value, Icon, tone, valueKey]) => (
            <button
              key={String(label)}
              type="button"
              onClick={() => selectMarket(valueKey as MarketFilter)}
              aria-pressed={market === valueKey}
              className={`rounded-xl border bg-white p-4 text-left shadow-[0_10px_30px_rgba(15,33,52,.08)] transition hover:-translate-y-0.5 hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-5 ${market === valueKey ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}
            >
              <div className={`mb-5 inline-flex rounded-lg bg-slate-100 p-2 ${tone}`}><Icon className="size-5" /></div>
              <p className="text-sm font-semibold text-slate-500">{label as string}</p><strong className="mt-1 block font-serif text-3xl">{value as number}</strong>
              <span className="mt-2 block text-xs font-bold text-blue-700">View projects →</span>
            </button>
          ))}
        </section>

        <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,33,52,.06)]">
          <div className="flex flex-col gap-5 border-b border-slate-200 px-5 py-6 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-600">Notification ledger</p><h2 className="mt-1 font-serif text-2xl font-bold">Projects & email delivery</h2></div>
            <div className="flex items-center gap-2 text-sm text-slate-500"><BellRing className="size-4 text-emerald-600" /> Secure live records</div>
          </div>
          <div className="grid gap-3 border-b border-slate-200 bg-slate-50/80 p-4 lg:grid-cols-[minmax(260px,2fr)_1fr_1fr_1fr]">
            <label className="relative"><span className="sr-only">Search projects</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 bg-white pl-9 text-base" placeholder="Search project, RERA number or builder" /></label>
            <NativeSelect value={market} onChange={(event) => selectMarket(event.target.value as MarketFilter)} className="h-11 w-full bg-white text-base"><NativeSelectOption value="all">All markets</NativeSelectOption><NativeSelectOption value="gurugram">Gurugram</NativeSelectOption><NativeSelectOption value="faridabad">Faridabad</NativeSelectOption><NativeSelectOption value="noida">Noida / Greater Noida</NativeSelectOption><NativeSelectOption value="other">Other Haryana</NativeSelectOption></NativeSelect>
            <NativeSelect value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }} className="h-11 w-full bg-white text-base"><NativeSelectOption value="all">All sources</NativeSelectOption>{sources.map((item) => <NativeSelectOption key={item} value={item}>{item}</NativeSelectOption>)}</NativeSelect>
            <NativeSelect value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-11 w-full bg-white text-base"><NativeSelectOption value="all">All email statuses</NativeSelectOption><NativeSelectOption value="sent">Sent</NativeSelectOption><NativeSelectOption value="pending">Pending</NativeSelectOption><NativeSelectOption value="failed">Failed</NativeSelectOption><NativeSelectOption value="baseline">Baseline (no email)</NativeSelectOption></NativeSelect>
          </div>
          <div className="flex items-center justify-between px-5 py-3 text-sm text-slate-500"><span><strong className="text-slate-800">{filtered.length}</strong> matching projects</span><span>Page {safePage} of {totalPages}</span></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead className="bg-[#edf1f5] text-xs font-bold uppercase tracking-[.08em] text-slate-500"><tr><th className="px-5 py-3">Project</th><th className="px-5 py-3">RERA number</th><th className="px-5 py-3">Market</th><th className="px-5 py-3">Registration</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Detected</th><th className="px-5 py-3">Source</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-blue-50/30">
                    <td className="min-w-[260px] px-5 py-4"><div className="font-bold text-slate-900">{item.priority ? <Star className="mr-1.5 inline size-4 fill-amber-400 text-amber-400" /> : null}{item.project_name}</div><p className="mt-1 text-sm text-slate-500">{item.developer || "Builder not available"}</p><span className="mt-2 inline-flex rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{item.source}</span></td>
                    <td className="px-5 py-4"><code className="text-sm font-bold text-[#203d68]">{item.rera_number}</code><p className="mt-1 text-xs text-slate-500">ID {item.portal_project_id || "—"}</p></td>
                    <td className="px-5 py-4"><strong>{item.city || "Unknown"}</strong><p className="mt-1 text-sm text-slate-500">{item.project_type}</p></td>
                    <td className="px-5 py-4 text-sm">{item.registration_date}</td>
                    <td className="px-5 py-4"><StatusBadge status={item.email_status} /><p className="mt-2 text-xs text-slate-500">{formatDate(item.notified_at)}</p>{item.last_error ? <p className="mt-2 max-w-48 text-xs text-red-600">{item.last_error}</p> : null}</td>
                    <td className="px-5 py-4 text-sm">{formatDate(item.first_seen_at)}<p className="mt-1 text-xs text-slate-500">{item.attempts} attempt{item.attempts === 1 ? "" : "s"}</p></td>
                    <td className="px-5 py-4">{item.official_url ? <a href={item.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-900">Official <ArrowUpRight className="size-4" /></a> : "—"}</td>
                  </tr>
                ))}
                {!visible.length ? <tr><td colSpan={7} className="px-5 py-16 text-center text-base text-slate-500">No projects have been received yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? <nav className="flex items-center justify-between border-t border-slate-200 px-5 py-4" aria-label="Pagination"><button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Previous</button><span className="text-sm text-slate-500">{safePage} / {totalPages}</span><button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next →</button></nav> : null}
        </section>
      </div>
    </main>
  );
}
