import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Trash2, Plus } from 'lucide-react';

export default function Expenses({ expenses, setExpenses }) {
  const [entry, setEntry] = useState({ id: '', category: 'Utilities', amount: '', taxPercent: 0, taxAmount: 0, date: new Date().toISOString().slice(0, 10), note: '', receipt: '' });

  function addExpense() {
    if (!entry.amount) return;
    const taxAmount = (Number(entry.amount) * Number(entry.taxPercent || 0)) / 100;
    const ex = { ...entry, id: crypto.randomUUID(), amount: Number(entry.amount), taxAmount };
    setExpenses([ex, ...expenses]);
    setEntry({ id: '', category: 'Utilities', amount: '', taxPercent: 0, taxAmount: 0, date: new Date().toISOString().slice(0, 10), note: '', receipt: '' });
  }

  function removeExpense(id) {
    setExpenses(expenses.filter((e) => e.id !== id));
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEntry({ ...entry, receipt: String(reader.result) });
    reader.readAsDataURL(file);
  }

  const byCategory = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount || 0);
    });
    const total = Object.values(map).reduce((a, c) => a + c, 0);
    return { map, total };
  }, [expenses]);

  const monthlyTrend = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const m = (e.date || '').slice(0, 7);
      map[m] = (map[m] || 0) + Number(e.amount || 0);
    });
    const entries = Object.entries(map).sort((a, b) => (a[0] > b[0] ? 1 : -1));
    return entries;
  }, [expenses]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Expenses</h2>
          <p className="text-slate-500 text-sm">Track and categorize spending. Attach receipts and monitor trends.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 bg-white border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Category</label>
              <select className="border rounded-md px-3 py-2 text-sm" value={entry.category} onChange={(e) => setEntry({ ...entry, category: e.target.value })}>
                <option>Utilities</option>
                <option>Rent</option>
                <option>Salaries</option>
                <option>Software</option>
                <option>Travel</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Date</label>
              <input type="date" className="border rounded-md px-3 py-2 text-sm" value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Amount</label>
              <input type="number" className="border rounded-md px-3 py-2 text-sm" value={entry.amount} onChange={(e) => setEntry({ ...entry, amount: e.target.value })} />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Tax %</label>
              <input type="number" className="border rounded-md px-3 py-2 text-sm" value={entry.taxPercent} onChange={(e) => setEntry({ ...entry, taxPercent: Number(e.target.value) })} />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Note</label>
              <input type="text" className="border rounded-md px-3 py-2 text-sm" value={entry.note} onChange={(e) => setEntry({ ...entry, note: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <UploadCloud className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              Upload receipt
            </label>
            <button onClick={addExpense} className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-2 rounded-md shadow hover:shadow-lg">
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm font-medium mb-2">Spend by Category</div>
          <Donut data={byCategory.map} total={byCategory.total} />
        </div>

        <div className="bg-white border rounded-lg p-4 md:col-span-1">
          <div className="text-sm font-medium mb-2">Monthly Trend</div>
          <LineChart data={monthlyTrend} />
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Note</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-right">Tax</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">No expenses recorded yet.</td>
              </tr>
            )}
            {expenses.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-3 py-2">{e.date}</td>
                <td className="px-3 py-2">{e.category}</td>
                <td className="px-3 py-2">{e.note || '-'}</td>
                <td className="px-3 py-2 text-right">₹{Number(e.amount).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">₹{Number(e.taxAmount || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => removeExpense(e.id)} className="inline-flex items-center gap-2 text-red-600 hover:bg-red-50 px-2 py-1 rounded">
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Donut({ data, total }) {
  const colors = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];
  const entries = Object.entries(data || {});
  const radius = 56;
  const stroke = 16;
  const C = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={70} cy={70} r={radius} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        {entries.map(([k, v], i) => {
          const val = total ? v / total : 0;
          const len = val * C;
          const dasharray = `${len} ${C - len}`;
          const dashoffset = C - offset;
          offset += len;
          return (
            <motion.circle key={k} cx={70} cy={70} r={radius} stroke={colors[i % colors.length]} strokeWidth={stroke} fill="none" strokeDasharray={dasharray} strokeDashoffset={dashoffset} initial={{ strokeDasharray: `0 ${C}` }} animate={{ strokeDasharray: dasharray }} transition={{ duration: 0.8, delay: i * 0.1 }} />
          );
        })}
      </svg>
      <div className="text-xs space-y-1">
        {entries.map(([k, v], i) => (
          <div key={k} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ background: colors[i % colors.length] }} />
            <span className="text-slate-600">{k}</span>
            <span className="ml-auto font-medium">₹{v.toFixed(0)}</span>
          </div>
        ))}
        {entries.length === 0 && <div className="text-slate-400">No data</div>}
      </div>
    </div>
  );
}

function LineChart({ data }) {
  const width = 280;
  const height = 120;
  const padding = 24;
  const points = data.map(([, v]) => v);
  const max = Math.max(1, ...points);
  const step = (width - padding * 2) / Math.max(1, data.length - 1);
  const path = data
    .map(([, v], i) => {
      const x = padding + i * step;
      const y = height - padding - (v / max) * (height - padding * 2);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={data
          .map(([, v], i) => {
            const x = padding + i * step;
            const y = height - padding - (v / max) * (height - padding * 2);
            return `${x},${y}`;
          })
          .join(' ')}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="2"
      />
      <motion.path d={path} fill="none" stroke="#0ea5e9" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      <motion.polygon points={` ${padding},${height - padding} ${width - padding},${height - padding} ${width - padding},${height - padding - 1}`} fill="url(#grad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
    </svg>
  );
}
