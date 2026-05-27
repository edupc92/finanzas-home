import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { TransactionForm } from './TransactionForm'
import { useTransactions } from '../../hooks/useTransactions'
import { currentMonth } from '../../lib/utils'
import type { Transaction } from '../../types'

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  editing?: Transaction
}

export function TransactionModal({ open, onClose, editing }: TransactionModalProps) {
  const { createTransaction, updateTransaction } = useTransactions({ month: currentMonth() })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(data: Parameters<typeof createTransaction>[0]) {
    setSubmitting(true)
    try {
      if (editing) {
        await updateTransaction(editing.id, data)
      } else {
        await createTransaction(data)
      }
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar transacción' : 'Nueva transacción'}
      size="md"
    >
      <TransactionForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitting={submitting}
        initial={editing}
      />
    </Modal>
  )
}
