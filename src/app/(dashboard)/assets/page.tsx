'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppContext } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, ASSET_TYPES, CURRENCIES } from '@/lib/utils'
import { convertAmount } from '@/lib/currency'
import { Plus, Trash2, Package, Search } from 'lucide-react'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

interface Asset {
  id: string; dateAcquired: string; assetType: string; description: string
  currency: string; purchaseCost: number; estimatedValue: number; location?: string; notes?: string
}

const defaultForm = { dateAcquired: new Date().toISOString().slice(0, 10), assetType: '', description: '', currency: 'USD', purchaseCost: '', estimatedValue: '', location: '', notes: '' }

export default function AssetsPage() {
  const { selectedCurrency, exchangeRates } = useAppContext()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState('')

  const fetchData = () => {
    setLoading(true)
    fetch('/api/assets').then(r => r.json()).then(d => { setAssets(d); setLoading(false) })
  }
  useEffect(() => { fetchData() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setOpen(false); setForm(defaultForm); fetchData()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await fetch(`/api/assets/${deleteTarget.id}`, { method: 'DELETE' })
    fetchData()
  }

  const convert = (n: number, from: string) => convertAmount(n, from, selectedCurrency, exchangeRates)
  const fmt = (n: number, c = 'USD') => formatCurrency(n, c)

  const totalCost = assets.reduce((s, a) => s + convert(a.purchaseCost, a.currency), 0)
  const totalValue = assets.reduce((s, a) => s + convert(a.estimatedValue, a.currency), 0)
  const appreciation = totalValue - totalCost

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return assets.filter(a =>
      a.description.toLowerCase().includes(q) ||
      a.assetType.toLowerCase().includes(q) ||
      (a.location || '').toLowerCase().includes(q)
    )
  }, [assets, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-500 text-sm mt-1">Physical and tangible assets</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Add Asset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date Acquired</Label>
                  <Input type="date" value={form.dateAcquired} onChange={e => setForm({ ...form, dateAcquired: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Asset Type</Label>
                  <Select value={form.assetType} onValueChange={v => setForm({ ...form, assetType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input placeholder="e.g. MacBook Pro 14-inch" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Purchase Cost</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.purchaseCost} onChange={e => setForm({ ...form, purchaseCost: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Est. Value</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.estimatedValue} onChange={e => setForm({ ...form, estimatedValue: e.target.value })} />
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
                <Label>Location (optional)</Label>
                <Input placeholder="e.g. Home, Office" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>Add Asset</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Purchase Cost</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(totalCost, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Est. Value</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{fmt(totalValue, selectedCurrency)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Appreciation</p>
          <p className={`text-2xl font-bold mt-1 ${appreciation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{appreciation >= 0 ? '+' : ''}{fmt(appreciation, selectedCurrency)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
            placeholder="Search description, type, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            <Package className="w-8 h-8 mx-auto mb-3 opacity-30" />
            {search ? 'No results found' : 'No assets recorded'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Est. Value</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(a.dateAcquired).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{a.assetType}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">{a.description}</td>
                    <td className="px-5 py-3.5 text-gray-500">{a.location || '—'}</td>
                    <td className="px-5 py-3.5 text-right text-gray-500">{fmt(convert(a.purchaseCost, a.currency), selectedCurrency)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-amber-600">{fmt(convert(a.estimatedValue, a.currency), selectedCurrency)}</td>
                    <td className="px-5 py-3.5">
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: a.id, name: a.description })} className="h-7 w-7 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
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
        recordType="asset"
        recordName={deleteTarget?.name}
      />
    </div>
  )
}
