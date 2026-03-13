'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppContext } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, INCOME_TYPES, CURRENCIES, PAYMENT_STAGES, formatMonth } from '@/lib/utils'
import { convertAmount } from '@/lib/currency'
import { Plus, Trash2, Pencil, TrendingUp, Search } from 'lucide-react'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

interface IncomeEntry {
  id: string; dateReceived: string; sourceName: string; incomeType: string
  businessCategory?: string; description?: string; currency: string
  amount: number; paymentStage?: string; notes?: string
}

const defaultForm = { dateReceived: new Date().toISOString().slice(0, 10), sourceName: '', incomeType: '', businessCategory: '', description: '', currency: 'USD', amount: '', paymentStage: '', notes: '' }

export default function IncomePage() {
  const { selectedMonth, selectedCurrency, exchangeRates } = useAppContext()
  const [entries, setEntries] = useState<IncomeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [editEntry, setEditEntry] = useState<IncomeEntry | null>(null)
  const [editForm, setEditForm] = useState(defaultForm)
  const [search, setSearch] = useState('')

  const fetchEntries = () => {
    setLoading(true)
    fetch(`/api/income?month=${selectedMonth}`).then(r => r.json()).then(d => { setEntries(d); setLoading(false) })
  }
  useEffect(() => { fetchEntries() }, [selectedMonth])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/income', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { setOpen(false); setForm(defaultForm); fetchEntries() }
  }

  function openEdit(entry: IncomeEntry) {
    setEditEntry(entry)
    setEditForm({
      dateReceived: entry.dateReceived.slice(0, 10),
      sourceName: entry.sourceName,
      incomeType: entry.incomeType,
      businessCategory: entry.businessCategory || '',
      description: entry.description || '',
      currency: entry.currency,
      amount: String(entry.amount),
      paymentStage: entry.paymentStage || '',
      notes: entry.notes || '',
    })
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editEntry) return
    setSaving(true)
    await fetch(`/api/income/${editEntry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setSaving(false)
    setEditEntry(null)
    fetchEntries()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await fetch(`/api/income/${deleteTarget.id}`, { method: 'DELETE' })
    fetchEntries()
  }

  const convert = (n: number, from: string) => convertAmount(n, from, selectedCurrency, exchangeRates)
  const fmt = (n: number, c = 'USD') => formatCurrency(n, c)

  const totalIncome = entries.reduce((s, e) => s + convert(e.amount, e.currency), 0)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return entries.filter(e =>
      e.sourceName.toLowerCase().includes(q) ||
      e.incomeType.toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q) ||
      (e.paymentStage || '').toLowerCase().includes(q)
    )
  }, [entries, search])

  const typeBadge = (t: string) => (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{t}</span>
  )
  const stageBadge = (s: string) => s
    ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{s}</span>
    : <span className="text-gray-400">—</span>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income Log</h1>
          <p className="text-gray-500 text-sm mt-1">{formatMonth(selectedMonth)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Log Income</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Log Income</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date Received</Label>
                  <Input type="date" value={form.dateReceived} onChange={e => setForm({ ...form, dateReceived: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Income Type</Label>
                  <Select value={form.incomeType} onValueChange={v => setForm({ ...form, incomeType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{INCOME_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Source Name</Label>
                <Input placeholder="Client name / source" value={form.sourceName} onChange={e => setForm({ ...form, sourceName: e.target.value })} required />
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
                <Label>Payment Stage</Label>
                <Select value={form.paymentStage} onValueChange={v => setForm({ ...form, paymentStage: v })}>
                  <SelectTrigger><SelectValue placeholder="Select stage (optional)" /></SelectTrigger>
                  <SelectContent>{PAYMENT_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Input placeholder="Brief description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea placeholder="Additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>Save Income</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Income</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(totalIncome, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Entries</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{entries.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Avg per Entry</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{entries.length ? fmt(totalIncome / entries.length, selectedCurrency) : fmt(0)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
            placeholder="Search source, type, stage..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            <TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-30" />
            {search ? 'No results found' : `No income logged for ${formatMonth(selectedMonth)}`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(entry.dateReceived).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-gray-900 font-medium">{entry.sourceName}</td>
                    <td className="px-5 py-3.5">{typeBadge(entry.incomeType)}</td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{entry.description || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">{fmt(convert(entry.amount, entry.currency), selectedCurrency)}</td>
                    <td className="px-5 py-3.5">{stageBadge(entry.paymentStage || '')}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(entry)} className="h-7 w-7 text-gray-400 hover:text-blue-600">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: entry.id, name: entry.sourceName })} className="h-7 w-7 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Edit Modal */}
      <Dialog open={editEntry !== null} onOpenChange={open => { if (!open) setEditEntry(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Income Record</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date Received</Label>
                <Input type="date" value={editForm.dateReceived} onChange={e => setEditForm({ ...editForm, dateReceived: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Income Type</Label>
                <Select value={editForm.incomeType} onValueChange={v => setEditForm({ ...editForm, incomeType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{INCOME_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Source Name</Label>
              <Input placeholder="Client name / source" value={editForm.sourceName} onChange={e => setEditForm({ ...editForm, sourceName: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={editForm.currency} onValueChange={v => setEditForm({ ...editForm, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Stage</Label>
              <Select value={editForm.paymentStage} onValueChange={v => setEditForm({ ...editForm, paymentStage: v })}>
                <SelectTrigger><SelectValue placeholder="Select stage (optional)" /></SelectTrigger>
                <SelectContent>{PAYMENT_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input placeholder="Brief description" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setEditEntry(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        recordType="income"
        recordName={deleteTarget?.name}
      />
    </div>
  )
}
