import { useEffect, useMemo, useState } from 'react';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, FileText, Receipt, LayoutDashboard } from 'lucide-react';
import Hero from './components/Hero';
import Invoices from './components/Invoices';
import Expenses from './components/Expenses';
import Dashboard from './components/Dashboard';

const TABS = [
  { key: 'dashboard', label: 'Analytics', icon: LayoutDashboard },
  { key: 'invoices', label: 'Invoices', icon: FileText },
  { key: 'expenses', label: 'Expenses', icon: Receipt },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('mvp_invoices');
    return saved ? JSON.parse(saved) : [];
  });
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('mvp_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mvp_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('mvp_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const metrics = useMemo(() => {
    // Revenue: sum of (subtotal - discounts + taxes) for Paid/Sent
    const invTotals = invoices.map((inv) => computeInvoiceTotals(inv));
    const revenue = invTotals
      .filter((t, i) => ['Paid', 'Sent'].includes(invoices[i].status))
      .reduce((a, c) => a + c.grandTotal, 0);
    const paidRevenue = invTotals
      .filter((t, i) => invoices[i].status === 'Paid')
      .reduce((a, c) => a + c.grandTotal, 0);

    // Expenses total
    const expenseTotal = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);

    // Tax collected from invoices, tax paid from expenses
    const taxCollected = invTotals
      .filter((t, i) => ['Paid', 'Sent'].includes(invoices[i].status))
      .reduce((a, c) => a + c.taxTotal, 0);
    const taxPaid = expenses.reduce((a, e) => a + Number(e.taxAmount || 0), 0);

    const netProfit = revenue - expenseTotal;

    return { revenue, expenseTotal, netProfit, taxCollected, taxPaid, paidRevenue };
  }, [invoices, expenses]);

  function computeInvoiceTotals(invoice) {
    const items = invoice.items || [];
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    items.forEach((it) => {
      const qty = Number(it.qty || 0);
      const price = Number(it.price || 0);
      const disc = Number(it.discount || 0);
      const line = qty * price;
      const lineDiscount = (line * disc) / 100;
      const taxable = line - lineDiscount;
      const taxRate = Number(it.taxRate || 0);
      const lineTax = (taxable * taxRate) / 100;
      subtotal += line;
      discountTotal += lineDiscount;
      taxTotal += lineTax;
    });

    // For CGST/SGST split, already counted in taxRate per item; we can also provide split detail in UI
    const grandTotal = subtotal - discountTotal + taxTotal;
    const dueAmount = Math.max(0, grandTotal - Number(invoice.amountPaid || 0));
    return { subtotal, discountTotal, taxTotal, grandTotal, dueAmount };
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900">
      <Toaster richColors />
      <Hero />

      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                    active ? 'bg-slate-900 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-4 text-xs text-slate-500">
              <div className="hidden md:block">Paid Revenue: ₹{metrics.paidRevenue.toFixed(2)}</div>
              <div className="hidden md:block">Net Profit: ₹{metrics.netProfit.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <Dashboard invoices={invoices} expenses={expenses} computeInvoiceTotals={computeInvoiceTotals} metrics={metrics} />
            </motion.div>
          )}
          {activeTab === 'invoices' && (
            <motion.div key="invoices" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <Invoices
                invoices={invoices}
                setInvoices={setInvoices}
                computeInvoiceTotals={computeInvoiceTotals}
              />
            </motion.div>
          )}
          {activeTab === 'expenses' && (
            <motion.div key="expenses" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <Expenses expenses={expenses} setExpenses={setExpenses} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto px-4 pb-10 text-xs text-slate-500">
        Built for a delightful billing experience — responsive, animated, and practical.
      </footer>
    </div>
  );
}
