'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppContext } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, LIFESTYLE_TYPES, CURRENCIES, formatMonth } from '@/lib/utils'
import { convertAmount } from '@/lib/currency'
import { Plus, Trash2, Sparkles, Search } from 'lucide-react'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

interface LifestyleEntry {
  id: string; date: string; lifestyleType: string; description: string
  currency: string; amount: number; notes?: string
}

const defaultForm = { date: new Date().toISOString().slice(0, 10), lifestyleType: '', description: '', currency: 'USD', amount: '', notes: '' }

export default function LifestylePage() {
  const { selectedMonth, selectedCurrency, exchangeRates } = useAppContext()
  const [entries, setEntries] = useState<LifestyleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState('')

  const fetchData = () => {
    setLoading(true)
    fetch(`/api/lifestyle?month=${selectedMonth}`).then(r => r.json()).then(d => { setEntries(d); setLoading(false) })
  }
  useEffect(() => { fetchData() }, [selectedMonth])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/lifestyle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setOpen(false); setForm(defaultForm); fetchData()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await fetch(`/api/lifestyle/${deleteTarget.id}`, { method: 'DELETE' })
    fetchData()
  }

  const convert = (n: number, from: string) => convertAmount(n, from, selectedCurrency, exchangeRates)
  const fmt = (n: number, c = 'USD') => formatCurrency(n, c)

  const total = entries.reduce((s, e) => s + convert(e.amount, e.currency), 0)

  const byType: Record<string, number> = {}
  for (const e of entries) { byType[e.lifestyleType] = (byType[e.lifestyleType] || 0) + convert(e.amount, e.currency) }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return entries.filter(e =>
      e.lifestyleType.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    )
  }, [entries, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lifestyle Spending</h1>
          <p className="text-gray-500 text-sm mt-1">{formatMonth(selectedMonth)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Add Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Lifestyle Expense</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.lifestyleType} onValueChange={v => setForm({ ...form, lifestyleType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{LIFESTYLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input placeholder="What was it for?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
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
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>Add Expense</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Lifestyle</p>
          <p className="text-2xl font-bold text-pink-600 mt-1">{fmt(total, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Entries</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{entries.length}</p>
        </div>
        {Object.entries(byType).slice(0, 2).map(([type, amount]) => (
          <div key={type} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{type}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{fmt(amount, selectedCurrency)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
            placeholder="Search type, description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
            {search ? 'No results found' : `No lifestyle expenses for ${formatMonth(selectedMonth)}`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700">{e.lifestyleType}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">{e.description}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-pink-600">{fmt(convert(e.amount, e.currency), selectedCurrency)}</td>
                    <td className="px-5 py-3.5">
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: e.id, name: e.description })} className="h-7 w-7 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
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
        recordType="lifestyle"
        recordName={deleteTarget?.name}
      />
    </div>
  )
}
