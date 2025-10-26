import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Printer, Edit2, Trash2, Plus, IndianRupee, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Invoices({ invoices, setInvoices, computeInvoiceTotals }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyInvoice());

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open]);

  function emptyInvoice() {
    return {
      id: crypto.randomUUID(),
      invoiceNumber: autoInvoiceNumber(),
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
      customerName: '',
      customerEmail: '',
      gstType: 'None', // None | CGST_SGST | IGST
      gstin: '',
      items: [newItemRow()],
      notes: '',
      status: 'Draft', // Draft | Sent | Paid | Overdue
      amountPaid: 0,
    };
  }

  function newItemRow() {
    return { id: crypto.randomUUID(), name: '', qty: 1, price: 0, discount: 0, taxRate: 18 };
  }

  function autoInvoiceNumber() {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const seq = String((invoices?.length || 0) + 1).padStart(3, '0');
    return `INV-${ymd}-${seq}`;
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyInvoice());
    setOpen(true);
  }

  function openEdit(id) {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    setEditingId(id);
    setForm(JSON.parse(JSON.stringify(inv)));
    setOpen(true);
  }

  function saveInvoice() {
    const totals = computeInvoiceTotals(form);
    let next = [];
    if (editingId) {
      next = invoices.map((i) => (i.id === editingId ? { ...form } : i));
    } else {
      next = [form, ...invoices];
    }
    setInvoices(next);
    setOpen(false);
    setEditingId(null);
    const msg = editingId ? 'Invoice updated' : 'Invoice created';
    toast.success(`${msg} (₹${totals.grandTotal.toFixed(2)})`);
  }

  function deleteInvoice(id) {
    setInvoices(invoices.filter((i) => i.id !== id));
    toast('Invoice deleted');
  }

  function printInvoice(inv) {
    const totals = computeInvoiceTotals(inv);
    const win = window.open('', '_blank');
    if (!win) return;
    const html = `<!doctype html><html><head><meta charset='utf-8'><title>${inv.invoiceNumber}</title>
      <style>
        body{font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding:24px; color:#0f172a}
        h1{font-size:20px;margin:0}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;font-size:12px}
        .right{text-align:right}
      </style>
    </head><body>
      <h1>Invoice ${inv.invoiceNumber}</h1>
      <p>Date: ${inv.date} | Due: ${inv.dueDate}</p>
      <p>Customer: ${inv.customerName} (${inv.customerEmail || 'N/A'})</p>
      <p>GST Type: ${inv.gstType} | GSTIN: ${inv.gstin || 'N/A'}</p>
      <table><thead><tr><th>Item</th><th class='right'>Qty</th><th class='right'>Price</th><th class='right'>Disc %</th><th class='right'>Tax %</th><th class='right'>Line Total</th></tr></thead>
      <tbody>
        ${inv.items
          .map((it) => {
            const line = it.qty * it.price;
            const disc = (line * (it.discount || 0)) / 100;
            const taxable = line - disc;
            const lineTotal = taxable + (taxable * (it.taxRate || 0)) / 100;
            return `<tr><td>${it.name}</td><td class='right'>${it.qty}</td><td class='right'>₹${it.price.toFixed(
              2
            )}</td><td class='right'>${it.discount || 0}</td><td class='right'>${it.taxRate || 0}</td><td class='right'>₹${lineTotal.toFixed(2)}</td></tr>`;
          })
          .join('')}
      </tbody></table>
      <p style='margin-top:16px'>Subtotal: ₹${totals.subtotal.toFixed(2)} | Discount: ₹${totals.discountTotal.toFixed(
        2
      )} | Tax: ₹${totals.taxTotal.toFixed(2)} | <strong>Grand Total: ₹${totals.grandTotal.toFixed(2)}</strong></p>
      <p>Amount Paid: ₹${Number(inv.amountPaid || 0).toFixed(2)} | Due: ₹${totals.dueAmount.toFixed(2)}</p>
      <p>Status: ${inv.status}</p>
      <p>Notes: ${inv.notes || '-'}</p>
      <script>window.onload = () => window.print()</script>
    </body></html>`;
    win.document.write(html);
    win.document.close();
  }

  function emailInvoice(inv) {
    const totals = computeInvoiceTotals(inv);
    const subject = encodeURIComponent(`Invoice ${inv.invoiceNumber}`);
    const body = encodeURIComponent(
      `Hello ${inv.customerName},%0D%0A%0D%0A` +
        `Please find your invoice details below:%0D%0A` +
        `Total: ₹${totals.grandTotal.toFixed(2)} | Due: ₹${totals.dueAmount.toFixed(2)}%0D%0A` +
        `Due Date: ${inv.dueDate}%0D%0A%0D%0A` +
        `Thank you!`
    );
    window.location.href = `mailto:${inv.customerEmail || ''}?subject=${subject}&body=${body}`;
  }

  const totalStats = useMemo(() => {
    const t = invoices.reduce(
      (acc, inv) => {
        const totals = computeInvoiceTotals(inv);
        acc.count += 1;
        acc.total += totals.grandTotal;
        acc.due += totals.dueAmount;
        acc.tax += totals.taxTotal;
        return acc;
      },
      { count: 0, total: 0, due: 0, tax: 0 }
    );
    return t;
  }, [invoices, computeInvoiceTotals]);

  return (
    <section id="invoices" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Invoices</h2>
          <p className="text-slate-500 text-sm">Create, send, and manage invoices with taxes and discounts.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-2 rounded-md shadow hover:shadow-lg">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Invoices" value={String(totalStats.count)} />
        <StatCard label="Grand Total" value={`₹${totalStats.total.toFixed(2)}`} />
        <StatCard label="Tax Collected" value={`₹${totalStats.tax.toFixed(2)}`} />
        <StatCard label="Amount Due" value={`₹${totalStats.due.toFixed(2)}`} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Invoice</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Dates</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Due</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                  No invoices yet. Create your first invoice.
                </td>
              </tr>
            )}
            {invoices.map((inv) => {
              const totals = computeInvoiceTotals(inv);
              return (
                <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-medium">{inv.invoiceNumber}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{inv.customerName || '-'}</div>
                    <div className="text-xs text-slate-500">{inv.customerEmail || '-'}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    <div>Issue: {inv.date}</div>
                    <div>Due: {inv.dueDate}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">₹{totals.grandTotal.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">₹{totals.dueAmount.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${badgeClass(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => emailInvoice(inv)} title="Email" className="p-2 hover:bg-slate-100 rounded">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button onClick={() => printInvoice(inv)} title="Print/Save PDF" className="p-2 hover:bg-slate-100 rounded">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(inv.id)} title="Edit" className="p-2 hover:bg-slate-100 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteInvoice(inv.id)} title="Delete" className="p-2 hover:bg-red-50 rounded text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>{open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold">{editingId ? 'Edit Invoice' : 'New Invoice'}</h3>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-slate-100 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input label="Invoice No." value={form.invoiceNumber} onChange={(v) => setForm({ ...form, invoiceNumber: v })} />
                <Input label="Issue Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
                <Input label="Due Date" type="date" value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input label="Customer Name" value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} />
                <Input label="Email" type="email" value={form.customerEmail} onChange={(v) => setForm({ ...form, customerEmail: v })} />
                <div className="flex flex-col">
                  <label className="text-xs text-slate-500 mb-1">GST Type</label>
                  <select className="border rounded-md px-3 py-2 text-sm" value={form.gstType} onChange={(e) => setForm({ ...form, gstType: e.target.value })}>
                    <option value="None">None</option>
                    <option value="CGST_SGST">CGST + SGST</option>
                    <option value="IGST">IGST</option>
                  </select>
                </div>
                <Input label="GSTIN" value={form.gstin} onChange={(v) => setForm({ ...form, gstin: v })} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Items</div>
                  <button onClick={() => setForm({ ...form, items: [...form.items, newItemRow()] })} className="text-sm inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900 text-white">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-2">Name</th>
                        <th className="text-right p-2">Qty</th>
                        <th className="text-right p-2">Price</th>
                        <th className="text-right p-2">Discount %</th>
                        <th className="text-right p-2">Tax %</th>
                        <th className="text-right p-2">Line Total</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((it, idx) => {
                        const line = (Number(it.qty || 0) * Number(it.price || 0)) || 0;
                        const disc = (line * Number(it.discount || 0)) / 100;
                        const taxable = line - disc;
                        const lineTotal = taxable + (taxable * Number(it.taxRate || 0)) / 100;
                        return (
                          <tr key={it.id} className="border-b">
                            <td className="p-2">
                              <input value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} className="w-full px-2 py-1 border rounded" placeholder="Item name" />
                            </td>
                            <td className="p-2 text-right">
                              <input type="number" min="0" value={it.qty} onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })} className="w-20 px-2 py-1 border rounded text-right" />
                            </td>
                            <td className="p-2 text-right">
                              <input type="number" min="0" value={it.price} onChange={(e) => updateItem(idx, { price: Number(e.target.value) })} className="w-24 px-2 py-1 border rounded text-right" />
                            </td>
                            <td className="p-2 text-right">
                              <input type="number" min="0" value={it.discount} onChange={(e) => updateItem(idx, { discount: Number(e.target.value) })} className="w-24 px-2 py-1 border rounded text-right" />
                            </td>
                            <td className="p-2 text-right">
                              <input type="number" min="0" value={it.taxRate} onChange={(e) => updateItem(idx, { taxRate: Number(e.target.value) })} className="w-24 px-2 py-1 border rounded text-right" />
                            </td>
                            <td className="p-2 text-right font-medium">₹{lineTotal.toFixed(2)}</td>
                            <td className="p-2 text-right">
                              <button onClick={() => removeItem(idx)} className="text-red-600 hover:bg-red-50 rounded px-2 py-1">Remove</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" rows={3} placeholder="Notes or terms" />
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <TotalsPanel invoice={form} />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Status</label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        <option>Draft</option>
                        <option>Sent</option>
                        <option>Paid</option>
                        <option>Overdue</option>
                      </select>
                    </div>
                    <Input label="Amount Paid" type="number" value={form.amountPaid} onChange={(v) => setForm({ ...form, amountPaid: Number(v) })} />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <IndianRupee className="w-4 h-4" />
                Smart tax split for CGST/SGST is reflected in tax totals for reporting.
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={saveInvoice} className="px-4 py-2 text-sm rounded-md bg-slate-900 text-white inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {editingId ? 'Save Changes' : 'Create Invoice'}
                </motion.button>
              </div>
            </div>
            <SuccessCurrencyAnimation trigger={!editingId} />
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </section>
  );

  function updateItem(idx, patch) {
    const items = [...form.items];
    items[idx] = { ...items[idx], ...patch };
    setForm({ ...form, items });
  }

  function removeItem(idx) {
    const items = form.items.filter((_, i) => i !== idx);
    setForm({ ...form, items: items.length ? items : [newItemRow()] });
  }
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-slate-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(type === 'number' ? e.target.value : e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
    </div>
  );
}

function badgeClass(status) {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-700';
    case 'Sent':
      return 'bg-blue-100 text-blue-700';
    case 'Overdue':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function TotalsPanel({ invoice }) {
  const items = invoice.items || [];
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  items.forEach((it) => {
    const qty = Number(it.qty || 0);
    const price = Number(it.price || 0);
    const disc = Number(it.discount || 0);
    const line = qty * price;
    const lineDisc = (line * disc) / 100;
    const taxable = line - lineDisc;
    const lineTax = (taxable * Number(it.taxRate || 0)) / 100;
    subtotal += line;
    discountTotal += lineDisc;
    taxTotal += lineTax;
  });
  const grandTotal = subtotal - discountTotal + taxTotal;
  const dueAmount = Math.max(0, grandTotal - Number(invoice.amountPaid || 0));

  const split = invoice.gstType === 'CGST_SGST' ? { cgst: taxTotal / 2, sgst: taxTotal / 2 } : { igst: taxTotal };

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Subtotal</span>
        <span className="font-medium">₹{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Discount</span>
        <span className="font-medium">- ₹{discountTotal.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Tax</span>
        <span className="font-medium">₹{taxTotal.toFixed(2)}</span>
      </div>
      {invoice.gstType === 'CGST_SGST' && (
        <div className="text-xs text-slate-500 mt-1">CGST: ₹{split.cgst.toFixed(2)} | SGST: ₹{split.sgst.toFixed(2)}</div>
      )}
      {invoice.gstType === 'IGST' && (
        <div className="text-xs text-slate-500 mt-1">IGST: ₹{split.igst.toFixed(2)}</div>
      )}
      <div className="flex items-center justify-between text-sm mt-2 border-t pt-2">
        <span className="text-slate-700">Grand Total</span>
        <span className="font-semibold">₹{grandTotal.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-sm mt-1">
        <span className="text-slate-700">Due</span>
        <span className="font-semibold">₹{dueAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function SuccessCurrencyAnimation({ trigger }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {trigger && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 400, opacity: 0, rotate: 0 }}
                animate={{ y: -40, opacity: 0.9, rotate: 15 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 + i * 0.08 }}
                className="absolute left-1/2"
                style={{ transform: `translateX(${(i - 5) * 40}px)` }}
              >
                <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 rounded-full px-3 py-1 text-xs inline-flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" /> Paid-ready
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
