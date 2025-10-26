import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Edit, Mail, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyItem = { name: '', qty: 1, price: 0, discount: 0, taxType: 'IGST', taxRate: 18 };

function calculateInvoice(items, shipping = 0) {
  let sub = 0;
  let tax = 0;
  items.forEach((it) => {
    const line = it.qty * it.price;
    const disc = (line * (Number(it.discount) || 0)) / 100;
    const taxable = line - disc;
    const t = (taxable * (Number(it.taxRate) || 0)) / 100;
    sub += taxable;
    tax += t;
  });
  const total = sub + tax + Number(shipping || 0);
  return { sub, tax, total };
}

function SuccessConfetti() {
  const symbols = ['💸', '💵', '💳', '🧾'];
  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-50">
      {symbols.map((s, i) => (
        <motion.div
          key={i}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: [0, 20, -20, 40], opacity: [0.6, 1, 1, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.4, repeat: 1, delay: i * 0.05 }}
          className="text-5xl absolute"
          style={{ left: `${20 + i * 15}%`, top: '30%' }}
        >
          {s}
        </motion.div>
      ))}
    </div>
  );
}

export default function InvoiceModule({ invoices, setInvoices }) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    number: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    customer: { name: '', email: '', phone: '', gstin: '' },
    items: [{ ...emptyItem }],
    notes: '',
    shipping: 0,
    status: 'Draft'
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setShowSuccess(false), 1600);
      return () => clearTimeout(t);
    }
  }, [showSuccess]);

  const totals = useMemo(() => {
    const { sub, tax, total } = calculateInvoice(form.items, form.shipping);
    return {
      subTotal: sub,
      taxTotal: tax,
      total,
    };
  }, [form.items, form.shipping]);

  const nextNumber = useMemo(() => {
    const nums = invoices.map(i => Number(String(i.number).replace(/\D/g, '')) || 0);
    const n = (nums.length ? Math.max(...nums) : 0) + 1;
    return `INV-${String(n).padStart(4, '0')}`;
  }, [invoices]);

  function openNew() {
    setEditingId(null);
    setForm({
      number: nextNumber,
      date: new Date().toISOString().slice(0, 10),
      dueDate: '',
      customer: { name: '', email: '', phone: '', gstin: '' },
      items: [{ ...emptyItem }],
      notes: '',
      shipping: 0,
      status: 'Draft'
    });
    setShowModal(true);
  }

  function openEdit(id) {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    setEditingId(id);
    setForm({ ...inv });
    setShowModal(true);
  }

  function saveInvoice() {
    const payload = {
      ...form,
      id: editingId || crypto.randomUUID(),
      subTotal: totals.subTotal,
      taxTotal: totals.taxTotal,
      total: totals.total
    };

    if (editingId) {
      setInvoices(prev => prev.map(i => i.id === editingId ? payload : i));
      toast.success('Invoice updated');
    } else {
      setInvoices(prev => [payload, ...prev]);
      toast.success('Invoice created');
    }

    setShowModal(false);
    setShowSuccess(true);
  }

  function deleteInvoice(id) {
    setInvoices(prev => prev.filter(i => i.id !== id));
    toast.info('Invoice deleted');
  }

  function markStatus(id, status) {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  }

  function printInvoice(inv) {
    const w = window.open('', '_blank');
    if (!w) return;
    const html = `<!doctype html><html><head><title>${inv.number}</title>
      <style>
        body{font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 24px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}
      </style></head><body>
      <h2>Invoice ${inv.number}</h2>
      <p>Date: ${inv.date} | Due: ${inv.dueDate || '-'}</p>
      <p>Customer: ${inv.customer.name} | GSTIN: ${inv.customer.gstin || '-'}</p>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Disc%</th><th>Tax</th><th>Amount</th></tr></thead><tbody>
      ${inv.items.map(it => {
        const line = it.qty * it.price;
        const disc = (line * (Number(it.discount) || 0)) / 100;
        const taxable = line - disc;
        const t = (taxable * (Number(it.taxRate) || 0)) / 100;
        const amount = taxable + t;
        return `<tr><td>${it.name}</td><td>${it.qty}</td><td>${it.price}</td><td>${it.discount}</td><td>${it.taxType} ${it.taxRate}%</td><td>${amount.toFixed(2)}</td></tr>`
      }).join('')}
      </tbody></table>
      <h3>Total: ₹${inv.total.toFixed(2)}</h3>
      <p>Notes: ${inv.notes || '-'}</p>
      <script>window.print();setTimeout(()=>window.close(), 100);</script>
      </body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function emailInvoice(inv) {
    const subject = encodeURIComponent(`Invoice ${inv.number}`);
    const body = encodeURIComponent(`Hello ${inv.customer.name || ''},%0D%0A%0D%0APlease find your invoice details below:%0D%0AInvoice No: ${inv.number}%0D%0ATotal: ₹${inv.total.toFixed(2)}%0D%0AStatus: ${inv.status}%0D%0A%0D%0AThank you!`);
    window.location.href = `mailto:${inv.customer.email || ''}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Invoices</h2>
          <p className="text-slate-400 text-sm">Create, send, and track invoices with tax and discounts.</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium">+ New Invoice</button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {invoices.map(inv => (
          <motion.div key={inv.id} layout className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">{inv.date}</div>
              <span className={`px-2 py-1 rounded text-xs ${inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300' : inv.status === 'Overdue' ? 'bg-rose-500/20 text-rose-300' : inv.status === 'Sent' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-200'}`}>{inv.status}</span>
            </div>
            <div className="mt-2 font-semibold">{inv.number}</div>
            <div className="text-slate-300 text-sm">{inv.customer.name || '—'}</div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-white text-lg font-semibold">₹{inv.total.toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => emailInvoice(inv)} className="p-2 rounded bg-slate-800 hover:bg-slate-700"><Mail size={16} /></button>
                <button onClick={() => printInvoice(inv)} className="p-2 rounded bg-slate-800 hover:bg-slate-700"><Printer size={16} /></button>
                <button onClick={() => openEdit(inv.id)} className="p-2 rounded bg-slate-800 hover:bg-slate-700"><Edit size={16} /></button>
                <button onClick={() => deleteInvoice(inv.id)} className="p-2 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-200"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">Tax: ₹{inv.taxTotal.toFixed(2)} • Subtotal: ₹{inv.subTotal.toFixed(2)}</div>
            <div className="mt-3 flex gap-2">
              {inv.status !== 'Paid' && (
                <button onClick={() => markStatus(inv.id, 'Paid')} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30"><CheckCircle2 size={14} /> Mark Paid</button>
              )}
              {inv.status !== 'Sent' && inv.status !== 'Paid' && (
                <button onClick={() => markStatus(inv.id, 'Sent')} className="text-xs px-2 py-1 rounded bg-amber-600/20 text-amber-200 hover:bg-amber-600/30">Mark Sent</button>
              )}
              {inv.status !== 'Overdue' && inv.status !== 'Paid' && (
                <button onClick={() => markStatus(inv.id, 'Overdue')} className="text-xs px-2 py-1 rounded bg-rose-600/20 text-rose-200 hover:bg-rose-600/30">Mark Overdue</button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/50" />
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="relative w-full max-w-3xl bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{editingId ? 'Edit Invoice' : 'New Invoice'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Invoice No</label>
                  <input className="mt-1 w-full bg-slate-800 rounded px-3 py-2" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Date</label>
                  <input type="date" className="mt-1 w-full bg-slate-800 rounded px-3 py-2" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Due Date</label>
                  <input type="date" className="mt-1 w-full bg-slate-800 rounded px-3 py-2" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400">Customer Name</label>
                  <input className="mt-1 w-full bg-slate-800 rounded px-3 py-2" value={form.customer.name} onChange={(e) => setForm({ ...form, customer: { ...form.customer, name: e.target.value } })} />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Email</label>
                  <input type="email" className="mt-1 w-full bg-slate-800 rounded px-3 py-2" value={form.customer.email} onChange={(e) => setForm({ ...form, customer: { ...form.customer, email: e.target.value } })} />
                </div>
                <div>
                  <label className="text-xs text-slate-400">GSTIN</label>
                  <input className="mt-1 w-full bg-slate-800 rounded px-3 py-2" value={form.customer.gstin} onChange={(e) => setForm({ ...form, customer: { ...form.customer, gstin: e.target.value } })} />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Items</h4>
                  <button onClick={() => setForm({ ...form, items: [...form.items, { ...emptyItem, name: '', qty: 1 }] })} className="text-sm px-3 py-1 rounded bg-slate-800 hover:bg-slate-700">+ Add Item</button>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Qty</th>
                        <th className="text-left p-2">Price</th>
                        <th className="text-left p-2">Discount %</th>
                        <th className="text-left p-2">Tax Type</th>
                        <th className="text-left p-2">Tax %</th>
                        <th className="text-right p-2">Amount</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((it, idx) => {
                        const line = it.qty * it.price;
                        const disc = (line * (Number(it.discount) || 0)) / 100;
                        const taxable = line - disc;
                        const t = (taxable * (Number(it.taxRate) || 0)) / 100;
                        const amount = taxable + t;
                        return (
                          <tr key={idx} className="border-t border-slate-800">
                            <td className="p-2"><input className="w-full bg-slate-800 rounded px-2 py-1" value={it.name} onChange={(e) => {
                              const items = [...form.items]; items[idx].name = e.target.value; setForm({ ...form, items });
                            }} /></td>
                            <td className="p-2"><input type="number" min="1" className="w-20 bg-slate-800 rounded px-2 py-1" value={it.qty} onChange={(e) => {
                              const items = [...form.items]; items[idx].qty = Number(e.target.value); setForm({ ...form, items });
                            }} /></td>
                            <td className="p-2"><input type="number" step="0.01" className="w-24 bg-slate-800 rounded px-2 py-1" value={it.price} onChange={(e) => {
                              const items = [...form.items]; items[idx].price = Number(e.target.value); setForm({ ...form, items });
                            }} /></td>
                            <td className="p-2"><input type="number" step="0.01" className="w-24 bg-slate-800 rounded px-2 py-1" value={it.discount} onChange={(e) => {
                              const items = [...form.items]; items[idx].discount = Number(e.target.value); setForm({ ...form, items });
                            }} /></td>
                            <td className="p-2">
                              <select className="w-28 bg-slate-800 rounded px-2 py-1" value={it.taxType} onChange={(e) => {
                                const items = [...form.items]; items[idx].taxType = e.target.value; setForm({ ...form, items });
                              }}>
                                <option>IGST</option>
                                <option>CGST/SGST</option>
                              </select>
                            </td>
                            <td className="p-2"><input type="number" step="0.01" className="w-20 bg-slate-800 rounded px-2 py-1" value={it.taxRate} onChange={(e) => {
                              const items = [...form.items]; items[idx].taxRate = Number(e.target.value); setForm({ ...form, items });
                            }} /></td>
                            <td className="p-2 text-right">₹{amount.toFixed(2)}</td>
                            <td className="p-2 text-right">
                              <button className="text-rose-300 hover:text-rose-200" onClick={() => {
                                const items = form.items.filter((_, i) => i !== idx);
                                setForm({ ...form, items: items.length ? items : [{ ...emptyItem }] });
                              }}>Remove</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400">Notes</label>
                  <textarea className="mt-1 w-full bg-slate-800 rounded px-3 py-2" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Shipping</label>
                  <input type="number" step="0.01" className="mt-1 w-full bg-slate-800 rounded px-3 py-2" value={form.shipping} onChange={(e) => setForm({ ...form, shipping: Number(e.target.value) })} />
                  <div className="mt-4 bg-slate-800 rounded-lg p-3 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{totals.subTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-slate-300"><span>Tax</span><span>₹{totals.taxTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between font-semibold text-white mt-2"><span>Total</span><span>₹{totals.total.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 bg-slate-800 rounded">
                  <option>Draft</option>
                  <option>Sent</option>
                  <option>Paid</option>
                  <option>Overdue</option>
                </select>
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700">Cancel</button>
                <button onClick={saveInvoice} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 font-medium">Save Invoice</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{showSuccess && <SuccessConfetti />}</AnimatePresence>
    </div>
  );
}
