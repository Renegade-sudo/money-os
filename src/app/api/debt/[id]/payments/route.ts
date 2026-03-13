import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const { id } = await params
    const body = await req.json()
    const { date, amountPaid, currency, paymentType, notes } = body

    const debt = await prisma.debt.findFirst({ where: { id, userId: user.id } })
    if (!debt) return NextResponse.json({ error: 'Debt not found' }, { status: 404 })

    const payment = await prisma.debtPayment.create({
      data: {
        debtId: id,
        userId: user.id,
        date: new Date(date),
        amountPaid: parseFloat(amountPaid),
        currency: currency || debt.currency,
        paymentType: paymentType || null,
        notes,
      },
    })

    // Update debt balance
    const newAmountPaid = debt.amountPaid + parseFloat(amountPaid)
    const newRemaining = debt.originalAmount - newAmountPaid
    const newStatus = newRemaining <= 0 ? 'paid' : 'active'

    await prisma.debt.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        remainingBalance: Math.max(0, newRemaining),
        status: newStatus,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch {
    return serverError()
  }
}
