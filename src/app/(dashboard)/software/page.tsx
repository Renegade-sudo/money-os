'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppContext } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, SOFTWARE_CATEGORIES, BILLING_CYCLES, CURRENCIES } from '@/lib/utils'
import { getMonthlyEquivalent } from '@/lib/utils'
import { convertAmount } from '@/lib/currency'
import { Plus, Trash2, Monitor, Clock, AlertTriangle, Search } from 'lucide-react'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

interface SoftwareSub {
  id: string; softwareName: string; category: string; planName?: string
  billingCycle: string; cost: number; currency: string; startDate?: string
  lastPaidDate?: string; nextDueDate?: string; status: string; paymentMethod?: string; notes?: string
}

const defaultForm = {
  softwareName: '', category: '', planName: '', billingCycle: 'monthly',
  cost: '', currency: 'USD', startDate: '', lastPaidDate: new Date().toISOString().slice(0, 10),
  nextDueDate: '', autoCalculatedNextDue: true, status: 'active', paymentMethod: '', notes: '',
}

export default function SoftwarePage() {
  const { selectedCurrency, exchangeRates } = useAppContext()
  const [subs, setSubs] = useState<SoftwareSub[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState('')

  const fetchData = () => {
    setLoading(true)
    fetch('/api/software').then(r => r.json()).then(d => { setSubs(d); setLoading(false) })
  }
  useEffect(() => { fetchData() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/software', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setOpen(false); setForm(defaultForm); fetchData()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await fetch(`/api/software/${deleteTarget.id}`, { method: 'DELETE' })
    fetchData()
  }

  async function toggleStatus(sub: SoftwareSub) {
    await fetch(`/api/software/${sub.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: sub.status === 'active' ? 'paused' : 'active' }),
    }); fetchData()
  }

  const convert = (n: number, from: string) => convertAmount(n, from, selectedCurrency, exchangeRates)
  const fmt = (n: number, c = 'USD') => formatCurrency(n, c)

  const activeSubs = subs.filter(s => s.status === 'active')
  const totalMonthly = activeSubs.reduce((s, sw) => s + convert(getMonthlyEquivalent(sw.cost, sw.billingCycle), sw.currency), 0)
  const totalYearly = totalMonthly * 12

  const isDueSoon = (sub: SoftwareSub) => {
    if (!sub.nextDueDate) return false
    const days = Math.ceil((new Date(sub.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days <= 7 && days >= 0
  }
  const isOverdue = (sub: SoftwareSub) => {
    if (!sub.nextDueDate) return false
    return new Date(sub.nextDueDate) < new Date()
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return subs.filter(s =>
      s.softwareName.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q) ||
      (s.planName || '').toLowerCase().includes(q)
    )
  }, [subs, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Software Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">Manage recurring software subscriptions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Add Subscription</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Software Subscription</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Software Name</Label>
                  <Input placeholder="e.g. Figma" value={form.softwareName} onChange={e => setForm({ ...form, softwareName: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{SOFTWARE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Plan Name (optional)</Label>
                  <Input placeholder="e.g. Professional" value={form.planName} onChange={e => setForm({ ...form, planName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Billing Cycle</Label>
                  <Select value={form.billingCycle} onValueChange={v => setForm({ ...form, billingCycle: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BILLING_CYCLES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cost</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} required />
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
                  <Label>Last Paid Date</Label>
                  <Input type="date" value={form.lastPaidDate} onChange={e => setForm({ ...form, lastPaidDate: e.target.value })} />
                </div>
                {form.billingCycle === 'custom' && (
                  <div className="space-y-1.5">
                    <Label>Next Due Date</Label>
                    <Input type="date" value={form.nextDueDate} onChange={e => setForm({ ...form, nextDueDate: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method (optional)</Label>
                <Input placeholder="e.g. Visa ending 4242" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>Add Subscription</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Active Subscriptions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activeSubs.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Monthly Total</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{fmt(totalMonthly, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Yearly Total</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">{fmt(totalYearly, selectedCurrency)}</p>
        </div>
      </div>

      {subs.some(s => isDueSoon(s) || isOverdue(s)) && (
        <div className="space-y-2">
          {subs.filter(isOverdue).map(s => (
            <div key={s.id} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-red-700"><strong>{s.softwareName}</strong> subscription is overdue — {fmt(convert(s.cost, s.currency), selectedCurrency)}</span>
            </div>
          ))}
          {subs.filter(s => isDueSoon(s) && !isOverdue(s)).map(s => (
            <div key={s.id} className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 text-sm">
              <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
              <span className="text-yellow-800"><strong>{s.softwareName}</strong> due on {new Date(s.nextDueDate!).toLocaleDateString()} — {fmt(convert(s.cost, s.currency), selectedCurrency)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
            placeholder="Search software, category, status..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            <Monitor className="w-8 h-8 mx-auto mb-3 opacity-30" />
            {search ? 'No results found' : 'No subscriptions tracked'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Software</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cycle</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">/mo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Next Due</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(sw => (
                  <tr key={sw.id} className={`hover:bg-gray-50 transition-colors ${sw.status !== 'active' ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {sw.softwareName}
                      {sw.planName && <span className="text-xs text-gray-400 ml-1.5">{sw.planName}</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{sw.category}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 capitalize">{sw.billingCycle}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{fmt(convert(sw.cost, sw.currency), selectedCurrency)}</td>
                    <td className="px-5 py-3.5 text-right text-gray-400 text-xs">{fmt(convert(getMonthlyEquivalent(sw.cost, sw.billingCycle), sw.currency), selectedCurrency)}</td>
                    <td className="px-5 py-3.5 text-xs">
                      {sw.nextDueDate ? (
                        <span className={isOverdue(sw) ? 'text-red-600 font-medium' : isDueSoon(sw) ? 'text-yellow-600 font-medium' : 'text-gray-500'}>
                          {new Date(sw.nextDueDate).toLocaleDateString()}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${sw.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{sw.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(sw)} className="text-xs text-gray-400 h-7 px-2 hover:text-gray-700">
                          {sw.status === 'active' ? 'Pause' : 'Resume'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: sw.id, name: sw.softwareName })} className="h-7 w-7 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
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
        recordType="software"
        recordName={deleteTarget?.name}
      />
    </div>
  )
}
