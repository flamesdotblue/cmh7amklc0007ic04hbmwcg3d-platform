import { useMemo } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

export default function Dashboard({ invoices, expenses, computeInvoiceTotals, metrics }) {
  const kpis = [
    { label: 'Total Revenue', value: metrics.revenue, color: 'bg-emerald-500' },
    { label: 'Total Expenses', value: metrics.expenseTotal, color: 'bg-rose-500' },
    { label: 'Tax Collected', value: metrics.taxCollected, color: 'bg-indigo-500' },
    { label: 'Tax Paid', value: metrics.taxPaid, color: 'bg-sky-500' },
    { label: 'Net Profit', value: metrics.netProfit, color: 'bg-amber-500' },
  ];

  const seriesRevenue = useMemo(() => seriesByMonth(invoices, (inv) => computeInvoiceTotals(inv).grandTotal), [invoices, computeInvoiceTotals]);
  const seriesExpense = useMemo(() => seriesByMonth(expenses, (e) => Number(e.amount || 0)), [expenses]);

  return (
    <section id="analytics" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Analytics & Tax Overview</h2>
          <p className="text-slate-500 text-sm">Insightful charts with animated transitions and counters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <CounterCard key={k.label} label={k.label} value={k.value} color={k.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4 md:col-span-2">
          <div className="flex items-center gap-2 text-slate-700 mb-2">
            <BarChart3 className="w-4 h-4" /> Revenue vs Expenses (Monthly)
          </div>
          <StackedArea revenue={seriesRevenue} expense={seriesExpense} />
        </div>
        <div className="bg-white border rounded-lg p-4">
          <TaxSummary invoices={invoices} expenses={expenses} computeInvoiceTotals={computeInvoiceTotals} />
        </div>
      </div>
    </section>
  );
}

function CounterCard({ label, value, color }) {
  const mv = useMotionValue(0);
  animate(mv, value, { duration: 0.8 });
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <motion.div className="text-2xl font-semibold tracking-tight mt-1">
        ₹{mv.to((v) => Number(v).toFixed(0))}
      </motion.div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, value === 0 ? 0 : 80)}%` }} />
      </div>
    </div>
  );
}

function StackedArea({ revenue, expense }) {
  const width = 720;
  const height = 220;
  const padding = 28;
  const labels = Array.from(new Set([...revenue.map((r) => r[0]), ...expense.map((e) => e[0])])).sort();
  const revMap = Object.fromEntries(revenue);
  const expMap = Object.fromEntries(expense);
  const points = labels.map((l) => ({ r: revMap[l] || 0, e: expMap[l] || 0 }));
  const max = Math.max(1, ...points.map((p) => Math.max(p.r, p.e)));
  const step = labels.length > 1 ? (width - padding * 2) / (labels.length - 1) : width - padding * 2;
  const pathFor = (key) =>
    points
      .map((p, i) => {
        const x = padding + i * step;
        const y = height - padding - ((key === 'r' ? p.r : p.e) / max) * (height - padding * 2);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="min-w-[560px]">
        <defs>
          <linearGradient id="gradR" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradE" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
        <Axis width={width} height={height} padding={padding} labels={labels} />
        <motion.path d={pathFor('e')} fill="none" stroke="#ef4444" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
        <motion.path d={pathFor('r')} fill="none" stroke="#10b981" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.05 }} />
      </svg>
    </div>
  );
}

function Axis({ width, height, padding, labels }) {
  const step = labels.length > 1 ? (width - padding * 2) / (labels.length - 1) : width - padding * 2;
  return (
    <g>
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" />
      {labels.map((l, i) => (
        <g key={l}>
          <line x1={padding + i * step} y1={height - padding} x2={padding + i * step} y2={height - padding + 6} stroke="#e2e8f0" />
          <text x={padding + i * step} y={height - padding + 18} textAnchor="middle" fontSize="10" fill="#64748b">{l}</text>
        </g>
      ))}
    </g>
  );
}

function TaxSummary({ invoices, expenses, computeInvoiceTotals }) {
  const taxCollected = useMemo(() => {
    return invoices.reduce((a, inv) => {
      const totals = computeInvoiceTotals(inv);
      if (['Paid', 'Sent'].includes(inv.status)) return a + totals.taxTotal;
      return a;
    }, 0);
  }, [invoices, computeInvoiceTotals]);

  const taxPaid = useMemo(() => expenses.reduce((a, e) => a + Number(e.taxAmount || 0), 0), [expenses]);
  const net = Math.max(0, taxCollected - taxPaid);
  const progress = taxCollected === 0 ? 0 : Math.min(100, Math.round((taxPaid / taxCollected) * 100));

  return (
    <div>
      <div className="text-sm font-medium mb-2">Tax Compliance</div>
      <div className="space-y-2 text-sm">
        <Row k="Collected" v={`₹${taxCollected.toFixed(2)}`} />
        <Row k="Paid" v={`₹${taxPaid.toFixed(2)}`} />
        <Row k="Net Due" v={`₹${net.toFixed(2)}`} />
      </div>
      <div className="mt-3">
        <div className="text-xs text-slate-500 mb-1">Tax Filing Progress</div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div className="h-full bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
        </div>
        <div className="text-right text-xs text-slate-500 mt-1">{progress}%</div>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-slate-600">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

function seriesByMonth(list, getter) {
  const map = {};
  list.forEach((it) => {
    const d = (it.date || it.dueDate || new Date().toISOString()).slice(0, 7);
    map[d] = (map[d] || 0) + Number(getter(it) || 0);
  });
  return Object.entries(map).sort((a, b) => (a[0] > b[0] ? 1 : -1));
}
