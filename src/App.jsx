import { useEffect, useMemo, useState } from 'react';
import { Toaster } from "sonner";
import HeroCover from './components/HeroCover';
import NavigationTabs from './components/NavigationTabs';
import InvoiceModule from './components/InvoiceModule';
import FinanceModule from './components/FinanceModule';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Global state persisted in localStorage
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
    const revenue = invoices.reduce((sum, inv) => sum + (inv.status === 'Paid' || inv.status === 'Sent' || inv.status === 'Overdue' ? inv.total : 0), 0);
    const taxCollected = invoices.reduce((sum, inv) => sum + inv.taxTotal, 0);
    const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const profit = revenue - expenseTotal;
    return { revenue, taxCollected, expenseTotal, profit };
  }, [invoices, expenses]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <HeroCover onCTA={() => setActiveTab('Invoices')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        <NavigationTabs active={activeTab} onChange={setActiveTab} metrics={metrics} />

        {activeTab === 'Invoices' && (
          <InvoiceModule invoices={invoices} setInvoices={setInvoices} />
        )}

        {activeTab === 'Dashboard' && (
          <FinanceModule invoices={invoices} expenses={expenses} setExpenses={setExpenses} metrics={metrics} />
        )}

        {activeTab === 'Expenses' && (
          <FinanceModule invoices={invoices} expenses={expenses} setExpenses={setExpenses} metrics={metrics} defaultView="Expenses" />
        )}

        {activeTab === 'Taxes' && (
          <FinanceModule invoices={invoices} expenses={expenses} setExpenses={setExpenses} metrics={metrics} defaultView="Taxes" />
        )}
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
