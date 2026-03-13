import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'
import { recalculateMonthlyAllocation } from '@/lib/calculations'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')

  const entries = await prisma.incomeEntry.findMany({
    where: { userId: user.id, ...(month ? { month } : {}) },
    orderBy: { dateReceived: 'desc' },
  })

  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const { dateReceived, sourceName, incomeType, businessCategory, description, currency, amount, paymentStage, linkedReceivableId, notes } = body

    if (!dateReceived || !sourceName || !incomeType || !amount) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const date = new Date(dateReceived)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    const entry = await prisma.incomeEntry.create({
      data: {
        userId: user.id,
        dateReceived: date,
        month,
        sourceName,
        incomeType,
        businessCategory,
        description,
        currency: currency || 'USD',
        amount: parseFloat(amount),
        paymentStage,
        linkedReceivableId,
        notes,
      },
    })

    // Recalculate allocation
    await recalculateMonthlyAllocation(user.id, month)

    return NextResponse.json(entry, { status: 201 })
  } catch {
    return serverError()
  }
}
