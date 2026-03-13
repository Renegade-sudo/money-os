'use client'
import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, CURRENCIES, PAYMENT_STAGES, PAYMENT_TYPES } from '@/lib/utils'
import { convertAmount } from '@/lib/currency'
import { Plus, Trash2, Users, DollarSign, Search, ChevronUp, ChevronDown, History } from 'lucide-react'
import { useAppContext } from '@/components/layout/DashboardLayout'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

interface RPayment { id: string; amount: number; date: string; currency: string; paymentType?: string }
interface Receivable {
  id: string; clientName: string; projectName: string; totalContractValue: number
  currency: string; paymentStage?: string; amountDue: number; expectedDate?: string
  amountReceived: number; status: string; notes?: string
  payments: RPayment[]
}

const defaultForm = { clientName: '', projectName: '', totalContractValue: '', currency: 'USD', paymentStage: '', amountDue: '', expectedDate: '', notes: '' }
const defaultPayment = { date: new Date().toISOString().slice(0, 10), amount: '', currency: 'USD', paymentType: '' }

const PAGE_SIZE = 10

export default function ReceivablesPage() {
  const { selectedCurrency, exchangeRates } = useAppContext()
  const [items, setItems] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [payOpen, setPayOpen] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [payForm, setPayForm] = useState(defaultPayment)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState('clientName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const fetchData = () => {
    setLoading(true)
    fetch('/api/receivables').then(r => r.json()).then(d => { setItems(d); setLoading(false) })
  }
  useEffect(() => { fetchData() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/receivables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setOpen(false); setForm(defaultForm); fetchData()
  }

  async function handlePayment(id: string, e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch(`/api/receivables/${id}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payForm) })
    setSaving(false); setPayOpen(null); setPayForm(defaultPayment); fetchData()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await fetch(`/api/receivables/${deleteTarget.id}`, { method: 'DELETE' })
    fetchData()
  }

  const convert = (n: number, from: string) => convertAmount(n, from, selectedCurrency, exchangeRates)
  const fmt = (n: number, c = 'USD') => formatCurrency(n, c)

  const totalPending = items.filter(r => r.status !== 'paid').reduce((s, r) => s + convert(r.amountDue - r.amountReceived, r.currency), 0)
  const totalReceived = items.reduce((s, r) => s + convert(r.amountReceived, r.currency), 0)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = items.filter(r =>
      r.clientName.toLowerCase().includes(q) ||
      r.projectName.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      (r.paymentStage || '').toLowerCase().includes(q)
    )
    list = [...list].sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''
      if (sortCol === 'clientName') { va = a.clientName; vb = b.clientName }
      else if (sortCol === 'amountDue') { va = convert(a.amountDue, a.currency); vb = convert(b.amountDue, b.currency) }
      else if (sortCol === 'amountReceived') { va = convert(a.amountReceived, a.currency); vb = convert(b.amountReceived, b.currency) }
      else if (sortCol === 'status') { va = a.status; vb = b.status }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
    return list
  }, [items, search, sortCol, sortDir, selectedCurrency, exchangeRates])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function sortBy(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setPage(1)
  }

  const SortIcon = ({ col }: { col: string }) => sortCol === col
    ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />)
    : null

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      partial: 'bg-blue-100 text-blue-700',
      paid: 'bg-emerald-100 text-emerald-700',
      overdue: 'bg-red-100 text-red-700',
    }
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receivables</h1>
          <p className="text-gray-500 text-sm mt-1">Client contracts and expected payments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Add Contract</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Receivable / Contract</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Client Name</Label>
                  <Input placeholder="Client name" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Project Name</Label>
                  <Input placeholder="Project name" value={form.projectName} onChange={e => setForm({ ...form, projectName: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Total Contract Value</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.totalContractValue} onChange={e => setForm({ ...form, totalContractValue: e.target.value })} required />
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
                  <Label>Amount Due Now</Label>
                  <Input type="number" step="0.01" placeholder="Defaults to full contract" value={form.amountDue} onChange={e => setForm({ ...form, amountDue: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Expected Date</Label>
                  <Input type="date" value={form.expectedDate} onChange={e => setForm({ ...form, expectedDate: e.target.value })} />
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
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>Add Receivable</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Pending</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{fmt(totalPending, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Received</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(totalReceived, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Active Contracts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{items.filter(r => r.status !== 'paid').length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
            placeholder="Search client, project, status..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
            {search ? 'No results found' : 'No receivables recorded'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none" onClick={() => sortBy('clientName')}>Client<SortIcon col="clientName" /></th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Project / Stage</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none" onClick={() => sortBy('amountDue')}>Due<SortIcon col="amountDue" /></th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none" onClick={() => sortBy('amountReceived')}>Received<SortIcon col="amountReceived" /></th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none" onClick={() => sortBy('status')}>Status<SortIcon col="status" /></th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expected</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map(r => {
                  const pct = r.amountDue > 0 ? Math.min(100, (r.amountReceived / r.amountDue) * 100) : 0
                  return (
                    <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${r.status === 'paid' ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3.5 font-medium text-gray-900">{r.clientName}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-gray-700">{r.projectName}</p>
                        {r.paymentStage && <p className="text-xs text-gray-400 mt-0.5">{r.paymentStage}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{fmt(convert(r.amountDue, r.currency), selectedCurrency)}</td>
                      <td className="px-5 py-3.5 text-right text-emerald-600 font-medium">{fmt(convert(r.amountReceived, r.currency), selectedCurrency)}</td>
                      <td className="px-5 py-3.5 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">{Math.round(pct)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">{statusBadge(r.status)}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{r.expectedDate ? new Date(r.expectedDate).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          {r.payments.length > 0 && (
                            <Dialog open={historyOpen === r.id} onOpenChange={o => setHistoryOpen(o ? r.id : null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-700"><History className="w-3.5 h-3.5" /></Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Payment History — {r.clientName}</DialogTitle></DialogHeader>
                                <div className="divide-y divide-gray-100">
                                  {r.payments.map(p => (
                                    <div key={p.id} className="py-2.5 flex justify-between text-sm">
                                      <div>
                                        <span className="text-gray-700">{new Date(p.date).toLocaleDateString()}</span>
                                        {p.paymentType && <span className="ml-2 text-xs text-gray-400">{p.paymentType}</span>}
                                      </div>
                                      <span className="font-semibold text-emerald-600">{fmt(p.amount, p.currency)}</span>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {r.status !== 'paid' && (
                            <Dialog open={payOpen === r.id} onOpenChange={o => setPayOpen(o ? r.id : null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-emerald-600"><DollarSign className="w-3.5 h-3.5" /></Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Record Payment — {r.clientName}</DialogTitle></DialogHeader>
                                <form onSubmit={e => handlePayment(r.id, e)} className="space-y-4">
                                  <div className="space-y-1.5">
                                    <Label>Date</Label>
                                    <Input type="date" value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} required />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                      <Label>Amount</Label>
                                      <Input type="number" step="0.01" placeholder="0.00" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
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
                                  <div className="flex gap-2 justify-end">
                                    <Button type="button" variant="outline" onClick={() => setPayOpen(null)}>Cancel</Button>
                                    <Button type="submit" disabled={saving}>Record Payment</Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => setDeleteTarget({ id: r.id, name: r.clientName })}>
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
        recordType="receivable"
        recordName={deleteTarget?.name}
      />
    </div>
  )
}
