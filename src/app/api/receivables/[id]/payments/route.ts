import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const { id } = await params
    const body = await req.json()
    const { date, amount, currency, paymentType } = body

    const receivable = await prisma.receivable.findFirst({ where: { id, userId: user.id } })
    if (!receivable) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const payment = await prisma.receivablePayment.create({
      data: {
        receivableId: id,
        date: new Date(date),
        amount: parseFloat(amount),
        currency: currency || receivable.currency,
        paymentType: paymentType || null,
      },
    })

    const newAmountReceived = receivable.amountReceived + parseFloat(amount)
    const status = newAmountReceived >= receivable.amountDue ? 'paid' : newAmountReceived > 0 ? 'partial' : 'pending'

    await prisma.receivable.update({
      where: { id },
      data: { amountReceived: newAmountReceived, status },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch {
    return serverError()
  }
}
