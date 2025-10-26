import { BarChart3, FileText, Wallet } from 'lucide-react';

export default function NavigationTabs({ active, onChange, metrics }) {
  const tabs = [
    { key: 'Dashboard', label: 'Analytics', icon: BarChart3 },
    { key: 'Invoices', label: 'Invoices', icon: FileText },
    { key: 'Expenses', label: 'Expenses', icon: Wallet },
    { key: 'Taxes', label: 'Taxes', icon: BarChart3 },
  ];

  return (
    <div id="dashboard" className="sticky top-0 z-20 -mt-8 pt-4 pb-4 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => onChange(t.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <div>
              Revenue: <span className="text-white font-semibold">₹{metrics.revenue.toLocaleString()}</span>
            </div>
            <div>
              Expenses: <span className="text-white font-semibold">₹{metrics.expenseTotal.toLocaleString()}</span>
            </div>
            <div>
              Profit: <span className="text-white font-semibold">₹{metrics.profit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
