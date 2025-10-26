import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Trash2 } from 'lucide-react';

function AnimatedStat({ label, value, prefix = '₹' }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="text-slate-400 text-sm">{label}</div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-2xl font-semibold"
      >
        {prefix}{value.toLocaleString()}
      </motion.div>
    </div>
  );
}

function SimpleBarChart({ data, height = 160 }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <svg viewBox={`0 0 ${data.length * 28} ${height}`} className="w-full h-40">
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 20);
        const x = i * 28 + 8;
        const y = height - h - 10;
        return (
          <g key={d.label}>
            <motion.rect
              initial={{ height: 0, y: height - 10 }}
              animate={{ height: h, y }}
              transition={{ type: 'spring', stiffness: 120, damping: 20, delay: i * 0.05 }}
              x={x}
              width={16}
              rx={4}
              fill="#60A5FA"
            />
            <text x={x + 8} y={height - 2} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function SimpleLineChart({ points, height = 120 }) {
  const max = Math.max(1, ...points.map(p => p.value));
  const width = Math.max(240, points.length * 40);
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1 || 1)) * (width - 20) + 10;
    const y = height - (p.value / max) * (height - 20) - 10;
    return [x, y];
  });
  const d = coords.map((c, i) => (i === 0 ? `M ${c[0]} ${c[1]}` : `L ${c[0]} ${c[1]}`)).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
      <polyline fill="none" stroke="#34d39933" strokeWidth="16" points={coords.map(c => c.join(',')).join(' ')} />
      <motion.path d={d} fill="none" stroke="#34D399" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
      {coords.map((c, i) => (
        <circle key={i} cx={c[0]} cy={c[1]} r={3} fill="#34D399" />
      ))}
    </svg>
  );
}

export default function FinanceModule({ invoices, expenses, setExpenses, metrics, defaultView = 'Dashboard' }) {
  const [view, setView] = useState(defaultView);
  const [newExpense, setNewExpense] = useState({ date: new Date().toISOString().slice(0,10), category: 'Utilities', note: '', amount: '', receipt: '' });

  const monthly = useMemo(() => {
    // group invoices and expenses by month (last 6 months)
    const now = new Date();
    const months = [...Array(6)].map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      return { key, label: d.toLocaleString('default', { month: 'short' }) };
    });
    const rev = months.map(m => ({ label: m.label, value: invoices.filter(inv => (inv.date || '').startsWith(m.key)).reduce((s, i) => s + i.total, 0) }));
    const exp = months.map(m => ({ label: m.label, value: expenses.filter(e => (e.date || '').startsWith(m.key)).reduce((s, e) => s + Number(e.amount||0), 0) }));
    return { rev, exp };
  }, [invoices, expenses]);

  const tax = useMemo(() => {
    const taxCollected = invoices.reduce((s, i) => s + i.taxTotal, 0);
    const gstPaid = expenses.reduce((s, e) => s + Number(e.tax || 0), 0);
    return { collected: taxCollected, paid: gstPaid, due: Math.max(0, taxCollected - gstPaid) };
  }, [invoices, expenses]);

  function addExpense() {
    if (!newExpense.amount) return;
    const e = { ...newExpense, id: crypto.randomUUID(), amount: Number(newExpense.amount) };
    setExpenses(prev => [e, ...prev]);
    setNewExpense({ date: new Date().toISOString().slice(0,10), category: 'Utilities', note: '', amount: '', receipt: '' });
  }

  function onReceiptUpload(file) {
    const reader = new FileReader();
    reader.onload = () => setNewExpense(prev => ({ ...prev, receipt: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{view === 'Expenses' ? 'Expenses' : view === 'Taxes' ? 'Tax Compliance' : 'Analytics Dashboard'}</h2>
          <p className="text-slate-400 text-sm">Insights, expenses tracking, and GST overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('Dashboard')} className={`px-3 py-2 rounded ${view==='Dashboard'?'bg-blue-600':'bg-slate-800 hover:bg-slate-700'}`}>Overview</button>
          <button onClick={() => setView('Expenses')} className={`px-3 py-2 rounded ${view==='Expenses'?'bg-blue-600':'bg-slate-800 hover:bg-slate-700'}`}>Expenses</button>
          <button onClick={() => setView('Taxes')} className={`px-3 py-2 rounded ${view==='Taxes'?'bg-blue-600':'bg-slate-800 hover:bg-slate-700'}`}>Taxes</button>
        </div>
      </div>

      {view === 'Dashboard' && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <AnimatedStat label="Total Revenue" value={metrics.revenue} />
          <AnimatedStat label="Total Expenses" value={metrics.expenseTotal} />
          <AnimatedStat label="Tax Collected" value={metrics.taxCollected} />
          <AnimatedStat label="Net Profit" value={metrics.profit} />

          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">Revenue (last 6 months)</div>
            </div>
            <div className="mt-2">
              <SimpleLineChart points={monthly.rev} />
            </div>
          </div>
          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">Expenses (last 6 months)</div>
            </div>
            <div className="mt-2">
              <SimpleBarChart data={monthly.exp} />
            </div>
          </div>

          <div className="md:col-span-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-sm text-slate-300">Tax Summary</div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Collected</div>
                <div className="text-xl font-semibold">₹{tax.collected.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Paid</div>
                <div className="text-xl font-semibold">₹{tax.paid.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Due</div>
                <div className="text-xl font-semibold">₹{tax.due.toLocaleString()}</div>
                <div className="mt-2 w-full h-2 bg-slate-700 rounded">
                  <div className="h-2 rounded bg-amber-400" style={{ width: `${Math.min(100, (tax.due / (tax.collected || 1)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'Expenses' && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-sm font-medium">Add Expense</div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-slate-400">Date</label>
                <input type="date" className="mt-1 w-full bg-slate-800 rounded px-3 py-2" value={newExpense.date} onChange={(e)=>setNewExpense({ ...newExpense, date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Category</label>
                <select className="mt-1 w-full bg-slate-800 rounded px-3 py-2" value={newExpense.category} onChange={(e)=>setNewExpense({ ...newExpense, category: e.target.value })}>
                  <option>Utilities</option>
                  <option>Rent</option>
                  <option>Salaries</option>
                  <option>Software</option>
                  <option>Travel</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Note</label>
                <input className="mt-1 w-full bg-slate-800 rounded px-3 py-2" value={newExpense.note} onChange={(e)=>setNewExpense({ ...newExpense, note: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Amount</label>
                <input type="number" step="0.01" className="mt-1 w-full bg-slate-800 rounded px-3 py-2" value={newExpense.amount} onChange={(e)=>setNewExpense({ ...newExpense, amount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400">GST Paid (optional)</label>
                <input type="number" step="0.01" className="mt-1 w-full bg-slate-800 rounded px-3 py-2" value={newExpense.tax||''} onChange={(e)=>setNewExpense({ ...newExpense, tax: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Receipt</label>
                <div className="mt-1 flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer">
                    <ImagePlus size={16} /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e)=>e.target.files && e.target.files[0] && onReceiptUpload(e.target.files[0])} />
                  </label>
                  {newExpense.receipt && <span className="text-xs text-emerald-300">Attached</span>}
                </div>
              </div>
              <button onClick={addExpense} className="w-full px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 font-medium">Add Expense</button>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 gap-3">
            {expenses.map((e) => (
              <div key={e.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">{e.date} • {e.category}</div>
                  <button onClick={() => setExpenses(prev => prev.filter(x => x.id !== e.id))} className="p-2 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-200"><Trash2 size={16} /></button>
                </div>
                <div className="mt-1 font-medium">₹{Number(e.amount).toLocaleString()} <span className="text-xs text-slate-400">{e.note}</span></div>
                {e.receipt && (
                  <div className="mt-3">
                    <img src={e.receipt} alt="Receipt" className="max-h-40 rounded border border-slate-800" />
                  </div>
                )}
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="text-slate-400 text-sm">No expenses yet. Add your first expense.</div>
            )}
          </div>
        </div>
      )}

      {view === 'Taxes' && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-sm text-slate-300">GST Summary</div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Collected</div>
                <div className="text-xl font-semibold">₹{metrics.taxCollected.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Paid (input)</div>
                <div className="text-xl font-semibold">₹{(expenses.reduce((s, e) => s + Number(e.tax || 0), 0)).toLocaleString()}</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Net Due</div>
                <div className="text-xl font-semibold">₹{(Math.max(0, metrics.taxCollected - expenses.reduce((s, e) => s + Number(e.tax || 0), 0))).toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="text-sm text-slate-400 mb-2">Tax Filing Progress</div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (metrics.taxCollected ? (expenses.reduce((s, e) => s + Number(e.tax || 0), 0) / metrics.taxCollected) * 100 : 0))}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-sm text-slate-300">Download Reports</div>
            <div className="mt-3 space-y-2 text-sm">
              <a
                href={URL.createObjectURL(new Blob([JSON.stringify({ invoices, expenses }, null, 2)], { type: 'application/json' }))}
                download={`tax-report-${new Date().toISOString().slice(0,10)}.json`}
                className="inline-block w-full px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-center"
              >
                Export JSON
              </a>
              <button onClick={() => window.print()} className="w-full px-3 py-2 rounded bg-slate-800 hover:bg-slate-700">Print to PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
