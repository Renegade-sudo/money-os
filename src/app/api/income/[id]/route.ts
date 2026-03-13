import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'
import { recalculateMonthlyAllocation } from '@/lib/calculations'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const { id } = await params
    const entry = await prisma.incomeEntry.findFirst({ where: { id, userId: user.id } })
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.incomeEntry.delete({ where: { id } })
    await recalculateMonthlyAllocation(user.id, entry.month)

    return NextResponse.json({ success: true })
  } catch {
    return serverError()
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.incomeEntry.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const date = body.dateReceived ? new Date(body.dateReceived) : existing.dateReceived
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    const entry = await prisma.incomeEntry.update({
      where: { id },
      data: {
        dateReceived: date,
        month,
        sourceName: body.sourceName ?? existing.sourceName,
        incomeType: body.incomeType ?? existing.incomeType,
        businessCategory: body.businessCategory ?? existing.businessCategory,
        description: body.description ?? existing.description,
        currency: body.currency ?? existing.currency,
        amount: body.amount !== undefined ? parseFloat(body.amount) : existing.amount,
        paymentStage: body.paymentStage ?? existing.paymentStage,
        notes: body.notes ?? existing.notes,
      },
    })

    await recalculateMonthlyAllocation(user.id, month)
    return NextResponse.json(entry)
  } catch {
    return serverError()
  }
}
