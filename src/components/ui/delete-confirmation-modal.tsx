'use client'
import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

const CONTEXTUAL_MESSAGES: Record<string, string> = {
  debt: 'Any associated payments will also be removed.',
  receivable: 'All linked payment records will also be removed.',
  income: 'This will permanently remove this income record.',
  bill: 'This will permanently remove this bill entry.',
  savings: 'This will permanently remove this savings entry.',
  investment: 'This will permanently remove this investment entry.',
  asset: 'This will permanently remove this asset record.',
  lifestyle: 'This will permanently remove this lifestyle entry.',
  software: 'This will permanently remove this subscription.',
}

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  recordType: string
  recordName?: string
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  recordType,
  recordName,
}: DeleteConfirmationModalProps) {
  const [deleting, setDeleting] = React.useState(false)

  async function handleConfirm() {
    setDeleting(true)
    await onConfirm()
    setDeleting(false)
    onClose()
  }

  function handleOpenChange(open: boolean) {
    if (!open && !deleting) onClose()
  }

  const contextMsg = CONTEXTUAL_MESSAGES[recordType]

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-base font-semibold text-gray-900">Delete Record</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-2 pt-1 pb-1">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{' '}
            {recordName
              ? <><span className="font-medium text-gray-900">&ldquo;{recordName}&rdquo;</span></>
              : 'this record'
            }?{' '}
            This action cannot be undone.
          </p>
          {contextMsg && (
            <p className="text-sm text-gray-400">{contextMsg}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={deleting}
            className="bg-gray-100 text-gray-900 hover:bg-gray-200 border-0"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="bg-red-600 text-white hover:bg-red-700 border-0 focus-visible:ring-red-600/20 disabled:bg-red-400"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
