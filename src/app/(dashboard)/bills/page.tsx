'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppContext } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, BILL_CATEGORIES, CURRENCIES, formatMonth } from '@/lib/utils'
import { convertAmount } from '@/lib/currency'
import { Plus, Trash2, Receipt, AlertTriangle, Search } from 'lucide-react'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

interface BillEntry {
  id: string; date: string; category: string; description: string
  currency: string; allocatedAmount: number; actualSpent: number
  balance: number; paidFrom?: string; notes?: string
}

const defaultForm = { date: new Date().toISOString().slice(0, 10), category: '', description: '', currency: 'USD', allocatedAmount: '', actualSpent: '', paidFrom: '', notes: '' }

export default function BillsPage() {
  const { selectedMonth, selectedCurrency, exchangeRates } = useAppContext()
  const [entries, setEntries] = useState<BillEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState('')

  const fetchData = () => {
    setLoading(true)
    fetch(`/api/bills?month=${selectedMonth}`).then(r => r.json()).then(d => { setEntries(d); setLoading(false) })
  }
  useEffect(() => { fetchData() }, [selectedMonth])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/bills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setOpen(false); setForm(defaultForm); fetchData()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await fetch(`/api/bills/${deleteTarget.id}`, { method: 'DELETE' })
    fetchData()
  }

  const convert = (n: number, from: string) => convertAmount(n, from, selectedCurrency, exchangeRates)
  const fmt = (n: number, c = 'USD') => formatCurrency(n, c)

  const totalAllocated = entries.reduce((s, b) => s + convert(b.allocatedAmount, b.currency), 0)
  const totalSpent = entries.reduce((s, b) => s + convert(b.actualSpent, b.currency), 0)
  const totalBalance = totalAllocated - totalSpent

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return entries.filter(b =>
      b.description.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      (b.paidFrom || '').toLowerCase().includes(q)
    )
  }, [entries, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bills & Living</h1>
          <p className="text-gray-500 text-sm mt-1">{formatMonth(selectedMonth)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Add Bill</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Bill / Expense</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{BILL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input placeholder="e.g. Monthly Rent" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Allocated</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.allocatedAmount} onChange={e => setForm({ ...form, allocatedAmount: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Actual Spent</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.actualSpent} onChange={e => setForm({ ...form, actualSpent: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Paid From (optional)</Label>
                <Input placeholder="e.g. Main Account" value={form.paidFrom} onChange={e => setForm({ ...form, paidFrom: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>Add Bill</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Allocated</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(totalAllocated, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Spent</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{fmt(totalSpent, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Balance</p>
          <p className={`text-2xl font-bold mt-1 ${totalBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(totalBalance, selectedCurrency)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
            placeholder="Search description, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            <Receipt className="w-8 h-8 mx-auto mb-3 opacity-30" />
            {search ? 'No results found' : `No bills for ${formatMonth(selectedMonth)}`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Allocated</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Spent</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Balance</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(b.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{b.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">{b.description}</td>
                    <td className="px-5 py-3.5 text-right text-gray-500">{fmt(convert(b.allocatedAmount, b.currency), selectedCurrency)}</td>
                    <td className="px-5 py-3.5 text-right text-purple-600 font-medium">{fmt(convert(b.actualSpent, b.currency), selectedCurrency)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1 font-medium ${b.balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {b.balance < 0 && <AlertTriangle className="w-3 h-3" />}
                        {fmt(convert(b.balance, b.currency), selectedCurrency)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: b.id, name: b.description })} className="h-7 w-7 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <DeleteConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        recordType="bill"
        recordName={deleteTarget?.name}
      />
    </div>
  )
}
