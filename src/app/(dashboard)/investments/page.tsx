'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppContext } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, INVESTMENT_TYPES, CURRENCIES, formatMonth } from '@/lib/utils'
import { convertAmount } from '@/lib/currency'
import { Plus, Trash2, BarChart2, Search } from 'lucide-react'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

interface Investment {
  id: string; date: string; investmentType: string; symbol?: string
  platform?: string; currency: string; amount: number; holdingType?: string; notes?: string
}

const defaultForm = { date: new Date().toISOString().slice(0, 10), investmentType: '', symbol: '', platform: '', currency: 'USD', amount: '', holdingType: '', notes: '' }

export default function InvestmentsPage() {
  const { selectedMonth, selectedCurrency, exchangeRates } = useAppContext()
  const [entries, setEntries] = useState<Investment[]>([])
  const [allEntries, setAllEntries] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState('')

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      fetch(`/api/investments?month=${selectedMonth}`).then(r => r.json()),
      fetch('/api/investments').then(r => r.json()),
    ]).then(([monthly, all]) => { setEntries(monthly); setAllEntries(all); setLoading(false) })
  }
  useEffect(() => { fetchData() }, [selectedMonth])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/investments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setOpen(false); setForm(defaultForm); fetchData()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await fetch(`/api/investments/${deleteTarget.id}`, { method: 'DELETE' })
    fetchData()
  }

  const convert = (n: number, from: string) => convertAmount(n, from, selectedCurrency, exchangeRates)
  const fmt = (n: number, c = 'USD') => formatCurrency(n, c)

  const totalAll = allEntries.reduce((s, i) => s + convert(i.amount, i.currency), 0)
  const totalMonth = entries.reduce((s, i) => s + convert(i.amount, i.currency), 0)

  const byType: Record<string, number> = {}
  for (const e of allEntries) { byType[e.investmentType] = (byType[e.investmentType] || 0) + convert(e.amount, e.currency) }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return entries.filter(i =>
      i.investmentType.toLowerCase().includes(q) ||
      (i.symbol || '').toLowerCase().includes(q) ||
      (i.platform || '').toLowerCase().includes(q)
    )
  }, [entries, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investments</h1>
          <p className="text-gray-500 text-sm mt-1">{formatMonth(selectedMonth)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Add Investment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Investment</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Investment Type</Label>
                  <Select value={form.investmentType} onValueChange={v => setForm({ ...form, investmentType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{INVESTMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Symbol (optional)</Label>
                  <Input placeholder="e.g. BTC, AAPL" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <Input placeholder="e.g. Binance, Robinhood" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Holding Type (optional)</Label>
                <Input placeholder="e.g. Long-term, Short-term" value={form.holdingType} onChange={e => setForm({ ...form, holdingType: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>Add Investment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Portfolio</p>
          <p className="text-2xl font-bold text-cyan-600 mt-1">{fmt(totalAll, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Invested This Month</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(totalMonth, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Asset Classes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(byType).length}</p>
        </div>
      </div>

      {Object.keys(byType).length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(byType).map(([type, amount]) => (
            <div key={type} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">{type}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{fmt(amount, selectedCurrency)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{totalAll > 0 ? Math.round((amount / totalAll) * 100) : 0}% of portfolio</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
            placeholder="Search type, symbol, platform..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            <BarChart2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
            {search ? 'No results found' : `No investments for ${formatMonth(selectedMonth)}`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Symbol</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Platform</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(i.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700">{i.investmentType}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-900 font-medium">{i.symbol || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{i.platform || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-cyan-600">{fmt(convert(i.amount, i.currency), selectedCurrency)}</td>
                    <td className="px-5 py-3.5">
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: i.id, name: i.symbol || i.investmentType })} className="h-7 w-7 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
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
        recordType="investment"
        recordName={deleteTarget?.name}
      />
    </div>
  )
}
