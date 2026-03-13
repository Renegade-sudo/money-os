'use client'
import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, CURRENCIES, PRIORITY_LEVELS, PAYMENT_TYPES } from '@/lib/utils'
import { convertAmount } from '@/lib/currency'
import { Plus, Trash2, CreditCard, DollarSign, Search, ChevronUp, ChevronDown, History } from 'lucide-react'
import { useAppContext } from '@/components/layout/DashboardLayout'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

interface DebtPayment { id: string; amountPaid: number; currency: string; date: string; paymentType?: string }
interface Debt {
  id: string; creditorName: string; originalAmount: number; currency: string
  startDate: string; dueDate?: string; priorityLevel: string; status: string
  amountPaid: number; remainingBalance: number; notes?: string
  payments: DebtPayment[]
}

const defaultDebt = { creditorName: '', originalAmount: '', currency: 'USD', startDate: new Date().toISOString().slice(0, 10), dueDate: '', priorityLevel: 'medium', notes: '' }
const defaultPayment = { date: new Date().toISOString().slice(0, 10), amountPaid: '', currency: 'USD', paymentType: '', notes: '' }

const PAGE_SIZE = 10

export default function DebtPage() {
  const { selectedCurrency, exchangeRates } = useAppContext()
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [payOpen, setPayOpen] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState<string | null>(null)
  const [form, setForm] = useState(defaultDebt)
  const [payForm, setPayForm] = useState(defaultPayment)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<string>('creditorName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const fetchDebts = () => {
    setLoading(true)
    fetch('/api/debt').then(r => r.json()).then(d => { setDebts(d); setLoading(false) })
  }
  useEffect(() => { fetchDebts() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/debt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setOpen(false); setForm(defaultDebt); fetchDebts()
  }

  async function handlePayment(debtId: string, e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch(`/api/debt/${debtId}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payForm) })
    setSaving(false); setPayOpen(null); setPayForm(defaultPayment); fetchDebts()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await fetch(`/api/debt/${deleteTarget.id}`, { method: 'DELETE' })
    fetchDebts()
  }

  const convert = (n: number, from: string) => convertAmount(n, from, selectedCurrency, exchangeRates)
  const fmt = (n: number, c = 'USD') => formatCurrency(n, c)

  const totalRemaining = debts.filter(d => d.status === 'active').reduce((s, d) => s + convert(d.remainingBalance, d.currency), 0)
  const totalPaid = debts.reduce((s, d) => s + convert(d.amountPaid, d.currency), 0)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = debts.filter(d =>
      d.creditorName.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q) ||
      d.priorityLevel.toLowerCase().includes(q)
    )
    list = [...list].sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''
      if (sortCol === 'creditorName') { va = a.creditorName; vb = b.creditorName }
      else if (sortCol === 'remainingBalance') { va = convert(a.remainingBalance, a.currency); vb = convert(b.remainingBalance, b.currency) }
      else if (sortCol === 'originalAmount') { va = convert(a.originalAmount, a.currency); vb = convert(b.originalAmount, b.currency) }
      else if (sortCol === 'priorityLevel') { va = a.priorityLevel; vb = b.priorityLevel }
      else if (sortCol === 'status') { va = a.status; vb = b.status }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
    return list
  }, [debts, search, sortCol, sortDir, selectedCurrency, exchangeRates])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function sort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setPage(1)
  }

  const SortIcon = ({ col }: { col: string }) => sortCol === col
    ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />)
    : null

  const priorityBadge = (p: string) => {
    const map: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-gray-100 text-gray-600' }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[p] || 'bg-gray-100 text-gray-600'}`}>{p}</span>
  }
  const statusBadge = (s: string) => {
    const map: Record<string, string> = { active: 'bg-blue-100 text-blue-700', paid: 'bg-emerald-100 text-emerald-700' }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Debt Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage all your debts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Add Debt</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Debt</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Creditor Name</Label>
                <Input placeholder="Bank / Person name" value={form.creditorName} onChange={e => setForm({ ...form, creditorName: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Original Amount</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.originalAmount} onChange={e => setForm({ ...form, originalAmount: e.target.value })} required />
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
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Due Date (optional)</Label>
                  <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priorityLevel} onValueChange={v => setForm({ ...form, priorityLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITY_LEVELS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea placeholder="Additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>Add Debt</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Remaining</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{fmt(totalRemaining, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(totalPaid, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Active Debts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{debts.filter(d => d.status === 'active').length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
            placeholder="Search creditor, status, priority..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-30" />
            {search ? 'No results found' : 'No debts recorded'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none" onClick={() => sort('creditorName')}>Creditor<SortIcon col="creditorName" /></th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none" onClick={() => sort('originalAmount')}>Original<SortIcon col="originalAmount" /></th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none" onClick={() => sort('remainingBalance')}>Remaining<SortIcon col="remainingBalance" /></th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none" onClick={() => sort('priorityLevel')}>Priority<SortIcon col="priorityLevel" /></th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none" onClick={() => sort('status')}>Status<SortIcon col="status" /></th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map(debt => {
                  const pct = debt.originalAmount > 0 ? Math.min(100, (debt.amountPaid / debt.originalAmount) * 100) : 0
                  return (
                    <tr key={debt.id} className={`hover:bg-gray-50 transition-colors ${debt.status === 'paid' ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3.5 font-medium text-gray-900">{debt.creditorName}</td>
                      <td className="px-5 py-3.5 text-right text-gray-600">{fmt(convert(debt.originalAmount, debt.currency), selectedCurrency)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-red-600">{fmt(convert(debt.remainingBalance, debt.currency), selectedCurrency)}</td>
                      <td className="px-5 py-3.5 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">{Math.round(pct)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">{priorityBadge(debt.priorityLevel)}</td>
                      <td className="px-5 py-3.5">{statusBadge(debt.status)}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          {debt.payments.length > 0 && (
                            <Dialog open={historyOpen === debt.id} onOpenChange={o => setHistoryOpen(o ? debt.id : null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-700"><History className="w-3.5 h-3.5" /></Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Payment History — {debt.creditorName}</DialogTitle></DialogHeader>
                                <div className="divide-y divide-gray-100">
                                  {debt.payments.map(p => (
                                    <div key={p.id} className="py-2.5 flex justify-between text-sm">
                                      <div>
                                        <span className="text-gray-700">{new Date(p.date).toLocaleDateString()}</span>
                                        {p.paymentType && <span className="ml-2 text-xs text-gray-400">{p.paymentType}</span>}
                                      </div>
                                      <span className="font-semibold text-emerald-600">{fmt(p.amountPaid, p.currency)}</span>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {debt.status !== 'paid' && (
                            <Dialog open={payOpen === debt.id} onOpenChange={o => setPayOpen(o ? debt.id : null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-emerald-600"><DollarSign className="w-3.5 h-3.5" /></Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Record Payment — {debt.creditorName}</DialogTitle></DialogHeader>
                                <form onSubmit={e => handlePayment(debt.id, e)} className="space-y-4">
                                  <div className="space-y-1.5">
                                    <Label>Date</Label>
                                    <Input type="date" value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} required />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                      <Label>Amount Paid</Label>
                                      <Input type="number" step="0.01" placeholder="0.00" value={payForm.amountPaid} onChange={e => setPayForm({ ...payForm, amountPaid: e.target.value })} required />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label>Currency</Label>
                                      <Select value={payForm.currency} onValueChange={v => setPayForm({ ...payForm, currency: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label>Payment Type</Label>
                                    <Select value={payForm.paymentType} onValueChange={v => setPayForm({ ...payForm, paymentType: v })}>
                                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                      <SelectContent>{PAYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label>Notes</Label>
                                    <Textarea rows={2} value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button type="button" variant="outline" onClick={() => setPayOpen(null)}>Cancel</Button>
                                    <Button type="submit" disabled={saving}>Record Payment</Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => setDeleteTarget({ id: debt.id, name: debt.creditorName })}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
      <DeleteConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        recordType="debt"
        recordName={deleteTarget?.name}
      />
    </div>
  )
}
