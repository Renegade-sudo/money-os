'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppContext } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, SAVINGS_TYPES, CURRENCIES, formatMonth } from '@/lib/utils'
import { convertAmount } from '@/lib/currency'
import { Plus, Trash2, PiggyBank, Search } from 'lucide-react'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

interface SavingsEntry {
  id: string; date: string; savingsType: string; currency: string
  amount: number; actionType: string; purpose?: string; notes?: string
}

const defaultForm = { date: new Date().toISOString().slice(0, 10), savingsType: '', currency: 'USD', amount: '', actionType: 'deposit', purpose: '', notes: '' }

export default function SavingsPage() {
  const { selectedMonth, selectedCurrency, exchangeRates } = useAppContext()
  const [entries, setEntries] = useState<SavingsEntry[]>([])
  const [allEntries, setAllEntries] = useState<SavingsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState('')

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      fetch(`/api/savings?month=${selectedMonth}`).then(r => r.json()),
      fetch('/api/savings').then(r => r.json()),
    ]).then(([monthly, all]) => { setEntries(monthly); setAllEntries(all); setLoading(false) })
  }
  useEffect(() => { fetchData() }, [selectedMonth])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/savings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setOpen(false); setForm(defaultForm); fetchData()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await fetch(`/api/savings/${deleteTarget.id}`, { method: 'DELETE' })
    fetchData()
  }

  const convert = (n: number, from: string) => convertAmount(n, from, selectedCurrency, exchangeRates)
  const fmt = (n: number, c = 'USD') => formatCurrency(n, c)

  const totalBalance = allEntries.reduce((s, e) => s + convert(e.actionType === 'withdrawal' ? -e.amount : e.amount, e.currency), 0)
  const monthDeposits = entries.filter(e => e.actionType === 'deposit').reduce((s, e) => s + convert(e.amount, e.currency), 0)
  const monthWithdrawals = entries.filter(e => e.actionType === 'withdrawal').reduce((s, e) => s + convert(e.amount, e.currency), 0)

  const byType: Record<string, number> = {}
  for (const e of allEntries) {
    const delta = convert(e.actionType === 'withdrawal' ? -e.amount : e.amount, e.currency)
    byType[e.savingsType] = (byType[e.savingsType] || 0) + delta
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return entries.filter(e =>
      e.savingsType.toLowerCase().includes(q) ||
      e.actionType.toLowerCase().includes(q) ||
      (e.purpose || '').toLowerCase().includes(q)
    )
  }, [entries, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Savings</h1>
          <p className="text-gray-500 text-sm mt-1">{formatMonth(selectedMonth)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Add Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Savings Entry</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Action</Label>
                  <Select value={form.actionType} onValueChange={v => setForm({ ...form, actionType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Savings Type</Label>
                <Select value={form.savingsType} onValueChange={v => setForm({ ...form, savingsType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{SAVINGS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
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
                <Label>Purpose (optional)</Label>
                <Input placeholder="e.g. Emergency fund top-up" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>Save Entry</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Balance</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{fmt(totalBalance, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Month Deposits</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(monthDeposits, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Month Withdrawals</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{fmt(monthWithdrawals, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Savings Types</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(byType).length}</p>
        </div>
      </div>

      {Object.keys(byType).length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(byType).map(([type, balance]) => (
            <div key={type} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">{type}</p>
              <p className={`text-xl font-bold mt-1 ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{fmt(balance, selectedCurrency)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
            placeholder="Search type, action, purpose..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            <PiggyBank className="w-8 h-8 mx-auto mb-3 opacity-30" />
            {search ? 'No results found' : `No savings entries for ${formatMonth(selectedMonth)}`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Purpose</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{e.savingsType}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${e.actionType === 'deposit' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{e.actionType}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{e.purpose || '—'}</td>
                    <td className={`px-5 py-3.5 text-right font-semibold ${e.actionType === 'withdrawal' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {e.actionType === 'withdrawal' ? '-' : '+'}{fmt(convert(e.amount, e.currency), selectedCurrency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: e.id, name: e.purpose || e.savingsType })} className="h-7 w-7 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
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
        recordType="savings"
        recordName={deleteTarget?.name}
      />
    </div>
  )
}
